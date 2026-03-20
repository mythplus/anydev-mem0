from datetime import datetime, timezone
import io 
import json 
import gzip 
import zipfile
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.database import get_db
from app.models import (
    User, App, Memory, MemoryState, Category, memory_categories, 
    MemoryStatusHistory, AccessControl, MemoryExport, ExportState
)
from app.utils.memory import get_memory_client

import os
import tempfile
from uuid import uuid4

router = APIRouter(prefix="/api/v1/backup", tags=["备份管理 Backup"])

# 导出文件存储目录
EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

class ExportRequest(BaseModel):
    user_id: str
    app_id: Optional[UUID] = None
    from_date: Optional[int] = None
    to_date: Optional[int] = None
    include_vectors: bool = True
    memory_ids: Optional[List[str]] = None  # 指定导出的记忆ID列表

def _iso(dt: Optional[datetime]) -> Optional[str]: 
    if isinstance(dt, datetime): 
        try: 
            return dt.astimezone(timezone.utc).isoformat()
        except: 
            return dt.replace(tzinfo=timezone.utc).isoformat()
    return None

def _parse_iso(dt: Optional[str]) -> Optional[datetime]:
    if not dt:
        return None
    try:
        return datetime.fromisoformat(dt)
    except Exception:
        try:
            return datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return None

def _export_sqlite(db: Session, req: ExportRequest) -> Dict[str, Any]: 
    user = db.query(User).filter(User.user_id == req.user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    time_filters = []
    if req.from_date: 
        time_filters.append(Memory.created_at >= datetime.fromtimestamp(req.from_date, tz=timezone.utc))
    if req.to_date: 
        time_filters.append(Memory.created_at <= datetime.fromtimestamp(req.to_date, tz=timezone.utc))

    mem_q = (
        db.query(Memory)
        .options(joinedload(Memory.categories), joinedload(Memory.app))
        .filter(
            Memory.user_id == user.id, 
            *(time_filters or []), 
            * ( [Memory.app_id == req.app_id] if req.app_id else [] ),
        )
    )
    # 按指定的 memory_ids 筛选
    if req.memory_ids:
        mem_q = mem_q.filter(Memory.id.in_([UUID(mid) for mid in req.memory_ids]))

    memories = mem_q.all()
    memory_ids = [m.id for m in memories]

    app_ids = sorted({m.app_id for m in memories if m.app_id})
    apps = db.query(App).filter(App.id.in_(app_ids)).all() if app_ids else []

    cats = sorted({c for m in memories for c in m.categories}, key = lambda c: str(c.id))

    mc_rows = db.execute(
        memory_categories.select().where(memory_categories.c.memory_id.in_(memory_ids))
    ).fetchall() if memory_ids else []

    history = db.query(MemoryStatusHistory).filter(MemoryStatusHistory.memory_id.in_(memory_ids)).all() if memory_ids else []

    acls = db.query(AccessControl).filter(
        AccessControl.subject_type == "app", 
        AccessControl.subject_id.in_(app_ids) if app_ids else False
    ).all() if app_ids else []

    return {
        "user": {
            "id": str(user.id), 
            "user_id": user.user_id, 
            "name": user.name, 
            "email": user.email, 
            "metadata": user.metadata_, 
            "created_at": _iso(user.created_at), 
            "updated_at": _iso(user.updated_at)
        }, 
        "apps": [
            {
                "id": str(a.id), 
                "owner_id": str(a.owner_id), 
                "name": a.name, 
                "description": a.description, 
                "metadata": a.metadata_, 
                "is_active": a.is_active, 
                "created_at": _iso(a.created_at), 
                "updated_at": _iso(a.updated_at),
            }
            for a in apps
        ], 
        "categories": [
            {
                "id": str(c.id), 
                "name": c.name, 
                "description": c.description, 
                "created_at": _iso(c.created_at), 
                "updated_at": _iso(c.updated_at), 
            }
            for c in cats
        ], 
        "memories": [
            {
                "id": str(m.id), 
                "user_id": str(m.user_id), 
                "app_id": str(m.app_id) if m.app_id else None, 
                "content": m.content, 
                "metadata": m.metadata_, 
                "state": m.state.value,
                "created_at": _iso(m.created_at), 
                "updated_at": _iso(m.updated_at), 
                "archived_at": _iso(m.archived_at), 
                "deleted_at": _iso(m.deleted_at), 
                "category_ids": [str(c.id) for c in m.categories], #TODO: figure out a way to add category names simply to this
            }
            for m in memories
        ], 
        "memory_categories": [
            {"memory_id": str(r.memory_id), "category_id": str(r.category_id)}
            for r in mc_rows
        ], 
        "status_history": [
            {
                "id": str(h.id), 
                "memory_id": str(h.memory_id), 
                "changed_by": str(h.changed_by), 
                "old_state": h.old_state.value, 
                "new_state": h.new_state.value, 
                "changed_at": _iso(h.changed_at), 
            }
            for h in history
        ], 
        "access_controls": [
            {
                "id": str(ac.id), 
                "subject_type": ac.subject_type, 
                "subject_id": str(ac.subject_id) if ac.subject_id else None, 
                "object_type": ac.object_type, 
                "object_id": str(ac.object_id) if ac.object_id else None, 
                "effect": ac.effect, 
                "created_at": _iso(ac.created_at), 
            }
            for ac in acls
        ], 
        "export_meta": {
            "app_id_filter": str(req.app_id) if req.app_id else None,
            "from_date": req.from_date,
            "to_date": req.to_date,
            "version": "1",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }

def _export_logical_memories_gz(
        db: Session, 
        *, 
        user_id: str, 
        app_id: Optional[UUID] = None, 
        from_date: Optional[int] = None, 
        to_date: Optional[int] = None,
        memory_ids: Optional[List[str]] = None
) -> bytes:
    """
    Export a provider-agnostic backup of memories so they can be restored to any vector DB
    by re-embedding content. One JSON object per line, gzip-compressed.

    Schema (per line):
    {
      "id": "<uuid>",
      "content": "<text>",
      "metadata": {...},
      "created_at": "<iso8601 or null>",
      "updated_at": "<iso8601 or null>",
      "state": "active|archived|deleted",
      "app": "<app name or null>",
      "categories": ["catA", "catB", ...]
    }
    """

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    time_filters = []
    if from_date: 
        time_filters.append(Memory.created_at >= datetime.fromtimestamp(from_date, tz=timezone.utc))
    if to_date: 
        time_filters.append(Memory.created_at <= datetime.fromtimestamp(to_date, tz=timezone.utc))
    
    q = (
        db.query(Memory)
        .options(joinedload(Memory.categories), joinedload(Memory.app))
        .filter(
            Memory.user_id == user.id,
            *(time_filters or []),
        )
    )
    if app_id:
        q = q.filter(Memory.app_id == app_id)
    # 按指定的 memory_ids 筛选
    if memory_ids:
        q = q.filter(Memory.id.in_([UUID(mid) for mid in memory_ids]))

    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb") as gz: 
        for m in q.all(): 
            record = {
                "id": str(m.id),
                "content": m.content,
                "metadata": m.metadata_ or {},
                "created_at": _iso(m.created_at),
                "updated_at": _iso(m.updated_at),
                "state": m.state.value,
                "app": m.app.name if m.app else None,
                "categories": [c.name for c in m.categories],
            }
            gz.write((json.dumps(record) + "\n").encode("utf-8"))
    return buf.getvalue()

@router.post("/export", summary="导出备份", description="将用户的记忆数据导出为ZIP压缩包，包含memories.json和memories.jsonl.gz文件，支持按应用和时间范围筛选")
async def export_backup(req: ExportRequest, db: Session = Depends(get_db)):
    sqlite_payload = _export_sqlite(db=db, req=req)
    memories_blob = _export_logical_memories_gz(
        db=db, 
        user_id=req.user_id, 
        app_id=req.app_id, 
        from_date=req.from_date, 
        to_date=req.to_date,

    )

    #TODO: add vector store specific exports in future for speed 

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", compression=zipfile.ZIP_DEFLATED) as zf: 
        zf.writestr("memories.json", json.dumps(sqlite_payload, indent=2))
        zf.writestr("memories.jsonl.gz", memories_blob)
        
    zip_buf.seek(0)
    return StreamingResponse(
        zip_buf, 
        media_type="application/zip", 
        headers={"Content-Disposition": f'attachment; filename="memories_export_{req.user_id}.zip"'},
    )

@router.post("/import", summary="导入备份", description="从ZIP备份文件中导入记忆数据，支持skip（跳过已存在）和overwrite（覆盖已存在）两种模式")
async def import_backup(
    file: UploadFile = File(..., description="Zip with memories.json and memories.jsonl.gz"),
    user_id: str = Form(..., description="Import memories into this user_id"),
    mode: str = Query("overwrite"), 
    db: Session = Depends(get_db)
): 
    if not file.filename.endswith(".zip"): 
        raise HTTPException(status_code=400, detail="Expected a zip file.")
    
    if mode not in {"skip", "overwrite"}:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'skip' or 'overwrite'.")
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")

    content = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(content), "r") as zf:
            names = zf.namelist()

            def find_member(filename: str) -> Optional[str]:
                for name in names:
                    # Skip directory entries
                    if name.endswith('/'):
                        continue
                    if name.rsplit('/', 1)[-1] == filename:
                        return name
                return None

            sqlite_member = find_member("memories.json")
            if not sqlite_member:
                raise HTTPException(status_code=400, detail="memories.json missing in zip")

            memories_member = find_member("memories.jsonl.gz")

            sqlite_data = json.loads(zf.read(sqlite_member))
            memories_blob = zf.read(memories_member) if memories_member else None
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid zip file")

    default_app = db.query(App).filter(App.owner_id == user.id, App.name == "openmemory").first()
    if not default_app: 
        default_app = App(owner_id=user.id, name="openmemory", is_active=True, metadata_={})
        db.add(default_app)
        db.commit()
        db.refresh(default_app)

    cat_id_map: Dict[str, UUID] = {}
    for c in sqlite_data.get("categories", []): 
        cat = db.query(Category).filter(Category.name == c["name"]).first()
        if not cat: 
            cat = Category(name=c["name"], description=c.get("description"))
            db.add(cat)
            db.commit()
            db.refresh(cat)
        cat_id_map[c["id"]] = cat.id

    old_to_new_id: Dict[str, UUID] = {}
    for m in sqlite_data.get("memories", []): 
        incoming_id = UUID(m["id"])
        existing = db.query(Memory).filter(Memory.id == incoming_id).first()

        # Cross-user collision: always mint a new UUID and import as a new memory
        if existing and existing.user_id != user.id:
            target_id = uuid4()
        else:
            target_id = incoming_id

        old_to_new_id[m["id"]] = target_id

        # Same-user collision + skip mode: leave existing row untouched
        if existing and (existing.user_id == user.id) and mode == "skip": 
            continue 
        
        # Same-user collision + overwrite mode: treat import as ground truth
        if existing and (existing.user_id == user.id) and mode == "overwrite": 
            incoming_state = m.get("state", "active")
            existing.user_id = user.id 
            existing.app_id = default_app.id
            existing.content = m.get("content") or ""
            existing.metadata_ = m.get("metadata") or {}
            try: 
                existing.state = MemoryState(incoming_state)
            except Exception: 
                existing.state = MemoryState.active
            # Update state-related timestamps from import (ground truth)
            existing.archived_at = _parse_iso(m.get("archived_at"))
            existing.deleted_at = _parse_iso(m.get("deleted_at"))
            existing.created_at = _parse_iso(m.get("created_at")) or existing.created_at
            existing.updated_at = _parse_iso(m.get("updated_at")) or existing.updated_at
            db.add(existing)
            db.commit()
            continue

        new_mem = Memory(
            id=target_id,
            user_id=user.id,
            app_id=default_app.id,
            content=m.get("content") or "",
            metadata_=m.get("metadata") or {},
            state=MemoryState(m.get("state", "active")) if m.get("state") else MemoryState.active,
            created_at=_parse_iso(m.get("created_at")) or datetime.now(timezone.utc),
            updated_at=_parse_iso(m.get("updated_at")) or datetime.now(timezone.utc),
            archived_at=_parse_iso(m.get("archived_at")),
            deleted_at=_parse_iso(m.get("deleted_at")),
        )
        db.add(new_mem)
        db.commit()

    for link in sqlite_data.get("memory_categories", []): 
        mid = old_to_new_id.get(link["memory_id"])
        cid = cat_id_map.get(link["category_id"])
        if not (mid and cid): 
            continue
        exists = db.execute(
            memory_categories.select().where(
                (memory_categories.c.memory_id == mid) & (memory_categories.c.category_id == cid)
            )
        ).first()

        if not exists: 
            db.execute(memory_categories.insert().values(memory_id=mid, category_id=cid))
            db.commit()

    for h in sqlite_data.get("status_history", []): 
        hid = UUID(h["id"])
        mem_id = old_to_new_id.get(h["memory_id"], UUID(h["memory_id"]))
        exists = db.query(MemoryStatusHistory).filter(MemoryStatusHistory.id == hid).first()
        if exists and mode == "skip":
            continue
        rec = exists if exists else MemoryStatusHistory(id=hid)
        rec.memory_id = mem_id
        rec.changed_by = user.id
        try:
            rec.old_state = MemoryState(h.get("old_state", "active"))
            rec.new_state = MemoryState(h.get("new_state", "active"))
        except Exception:
            rec.old_state = MemoryState.active
            rec.new_state = MemoryState.active
        rec.changed_at = _parse_iso(h.get("changed_at")) or datetime.now(timezone.utc)
        db.add(rec)
        db.commit()

    memory_client = get_memory_client()
    vector_store = getattr(memory_client, "vector_store", None) if memory_client else None

    if vector_store and memory_client and hasattr(memory_client, "embedding_model"):
        def iter_logical_records():
            if memories_blob:
                gz_buf = io.BytesIO(memories_blob)
                with gzip.GzipFile(fileobj=gz_buf, mode="rb") as gz:
                    for raw in gz:
                        yield json.loads(raw.decode("utf-8"))
            else:
                for m in sqlite_data.get("memories", []):
                    yield {
                        "id": m["id"],
                        "content": m.get("content"),
                        "metadata": m.get("metadata") or {},
                        "created_at": m.get("created_at"),
                        "updated_at": m.get("updated_at"),
                    }

        for rec in iter_logical_records():
            old_id = rec["id"]
            new_id = old_to_new_id.get(old_id, UUID(old_id))
            content = rec.get("content") or ""
            metadata = rec.get("metadata") or {}
            created_at = rec.get("created_at")
            updated_at = rec.get("updated_at")

            if mode == "skip":
                try:
                    get_fn = getattr(vector_store, "get", None)
                    if callable(get_fn) and vector_store.get(str(new_id)):
                        continue
                except Exception:
                    pass

            payload = dict(metadata)
            payload["data"] = content
            if created_at:
                payload["created_at"] = created_at
            if updated_at:
                payload["updated_at"] = updated_at
            payload["user_id"] = user_id
            payload.setdefault("source_app", "openmemory")

            try:
                vec = memory_client.embedding_model.embed(content, "add")
                vector_store.insert(vectors=[vec], payloads=[payload], ids=[str(new_id)])
            except Exception as e:
                print(f"Vector upsert failed for memory {new_id}: {e}")
                continue

        return {"message": f'Import completed into user "{user_id}"'}

    return {"message": f'Import completed into user "{user_id}"'}


# ===================== 导出记录管理 API =====================

from sqlalchemy import String as SAString


def _export_record_to_dict(record: MemoryExport) -> Dict[str, Any]:
    """将导出记录模型转换为响应字典"""
    return {
        "id": str(record.id),
        "state": record.state.value,
        "entity_count": record.entity_count or 0,
        "file_size": record.file_size,
        "error_message": record.error_message,
        "started_at": _iso(record.started_at),
        "completed_at": _iso(record.completed_at),
        "metadata_": record.metadata_ or {},
    }


@router.get("/exports", summary="获取导出记录列表", description="获取用户的所有导出记录，支持搜索和分页")
async def list_exports(
    user_id: str = Query(..., description="用户ID"),
    search: Optional[str] = Query(None, description="按ID搜索"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    q = db.query(MemoryExport).filter(MemoryExport.user_id == user.id)

    if search:
        # 支持按 ID 模糊搜索
        q = q.filter(MemoryExport.id.cast(SAString).ilike(f"%{search}%"))

    total = q.count()
    records = q.order_by(MemoryExport.started_at.desc()).offset((page - 1) * size).limit(size).all()

    return {
        "items": [_export_record_to_dict(r) for r in records],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size if size > 0 else 0,
    }


class CreateExportRequest(BaseModel):
    """创建导出请求"""
    user_id: str
    app_id: Optional[UUID] = None
    from_date: Optional[int] = None
    to_date: Optional[int] = None
    memory_ids: Optional[List[str]] = None  # 指定导出的记忆ID列表


@router.post("/exports", summary="创建导出任务", description="创建一个新的记忆导出任务，导出完成后可下载ZIP文件")
async def create_export(req: CreateExportRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 创建导出记录
    export_record = MemoryExport(
        id=uuid4(),
        user_id=user.id,
        state=ExportState.processing,
        metadata_={
            "app_id": str(req.app_id) if req.app_id else None,
            "from_date": req.from_date,
            "to_date": req.to_date,
            "memory_ids": req.memory_ids,
        }
    )
    db.add(export_record)
    db.commit()
    db.refresh(export_record)

    try:
        # 执行导出
        export_req = ExportRequest(
            user_id=req.user_id,
            app_id=req.app_id,
            from_date=req.from_date,
            to_date=req.to_date,
            include_vectors=True,
            memory_ids=req.memory_ids,
        )
        sqlite_payload = _export_sqlite(db=db, req=export_req)
        memories_blob = _export_logical_memories_gz(
            db=db,
            user_id=req.user_id,
            app_id=req.app_id,
            from_date=req.from_date,
            to_date=req.to_date,
            memory_ids=req.memory_ids,
        )

        # 统计导出的记忆数量
        entity_count = len(sqlite_payload.get("memories", []))

        # 写入 ZIP 文件
        file_name = f"memories_export_{str(export_record.id)[:8]}.zip"
        file_path = os.path.join(EXPORT_DIR, file_name)

        with zipfile.ZipFile(file_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("memories.json", json.dumps(sqlite_payload, indent=2))
            zf.writestr("memories.jsonl.gz", memories_blob)

        file_size = os.path.getsize(file_path)

        # 更新导出记录
        export_record.state = ExportState.completed
        export_record.entity_count = entity_count
        export_record.file_path = file_path
        export_record.file_size = file_size
        export_record.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(export_record)

    except Exception as e:
        export_record.state = ExportState.failed
        export_record.error_message = str(e)
        export_record.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

    return _export_record_to_dict(export_record)


@router.get("/exports/{export_id}/download", summary="下载导出文件", description="下载指定导出任务生成的ZIP文件")
async def download_export(
    export_id: UUID,
    user_id: str = Query(..., description="用户ID"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = db.query(MemoryExport).filter(
        MemoryExport.id == export_id,
        MemoryExport.user_id == user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Export record not found")

    if record.state != ExportState.completed:
        raise HTTPException(status_code=400, detail="Export not completed yet")

    if not record.file_path or not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="Export file not found")

    file_name = os.path.basename(record.file_path)
    return StreamingResponse(
        open(record.file_path, "rb"),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


@router.delete("/exports/{export_id}", summary="删除导出记录", description="删除指定的导出记录及其关联文件")
async def delete_export(
    export_id: UUID,
    user_id: str = Query(..., description="用户ID"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = db.query(MemoryExport).filter(
        MemoryExport.id == export_id,
        MemoryExport.user_id == user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Export record not found")

    # 删除关联文件
    if record.file_path and os.path.exists(record.file_path):
        try:
            os.remove(record.file_path)
        except Exception:
            pass

    db.delete(record)
    db.commit()

    return {"message": "Export record deleted successfully"}



    
            
        
 


    

    






    

    










 
