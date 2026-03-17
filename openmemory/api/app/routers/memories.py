import logging
from datetime import datetime, timezone
from typing import List, Optional, Set
from uuid import UUID

from app.database import get_db
from app.models import (
    AccessControl,
    App,
    Category,
    Memory,
    MemoryAccessLog,
    MemoryState,
    MemoryStatusHistory,
    User,
)
from app.schemas import MemoryResponse
from app.utils.memory import get_memory_client
from app.utils.permissions import check_memory_access_permissions
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate as sqlalchemy_paginate
from pydantic import BaseModel
from sqlalchemy import func, and_
from sqlalchemy.orm import Session, joinedload, aliased

router = APIRouter(prefix="/api/v1/memories", tags=["记忆管理 Memories"])


def get_memory_or_404(db: Session, memory_id: UUID) -> Memory:
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


def update_memory_state(db: Session, memory_id: UUID, new_state: MemoryState, user_id: UUID):
    memory = get_memory_or_404(db, memory_id)
    old_state = memory.state

    # Update memory state
    memory.state = new_state
    if new_state == MemoryState.archived:
        memory.archived_at = datetime.now(timezone.utc)
    elif new_state == MemoryState.deleted:
        memory.deleted_at = datetime.now(timezone.utc)

    # Record state change
    history = MemoryStatusHistory(
        memory_id=memory_id,
        changed_by=user_id,
        old_state=old_state,
        new_state=new_state
    )
    db.add(history)
    db.commit()
    return memory


def get_accessible_memory_ids(db: Session, app_id: UUID) -> Set[UUID]:
    """
    Get the set of memory IDs that the app has access to based on app-level ACL rules.
    Returns all memory IDs if no specific restrictions are found.
    """
    # Get app-level access controls
    app_access = db.query(AccessControl).filter(
        AccessControl.subject_type == "app",
        AccessControl.subject_id == app_id,
        AccessControl.object_type == "memory"
    ).all()

    # If no app-level rules exist, return None to indicate all memories are accessible
    if not app_access:
        return None

    # Initialize sets for allowed and denied memory IDs
    allowed_memory_ids = set()
    denied_memory_ids = set()

    # Process app-level rules
    for rule in app_access:
        if rule.effect == "allow":
            if rule.object_id:  # Specific memory access
                allowed_memory_ids.add(rule.object_id)
            else:  # All memories access
                return None  # All memories allowed
        elif rule.effect == "deny":
            if rule.object_id:  # Specific memory denied
                denied_memory_ids.add(rule.object_id)
            else:  # All memories denied
                return set()  # No memories accessible

    # Remove denied memories from allowed set
    if allowed_memory_ids:
        allowed_memory_ids -= denied_memory_ids

    return allowed_memory_ids


# List all memories with filtering
@router.get("/", response_model=Page[MemoryResponse], summary="获取记忆列表", description="获取用户的所有记忆，支持按应用、时间范围、分类筛选，支持搜索、排序和分页")
async def list_memories(
    user_id: str,
    app_id: Optional[UUID] = None,
    from_date: Optional[int] = Query(
        None,
        description="Filter memories created after this date (timestamp)",
        examples=[1718505600]
    ),
    to_date: Optional[int] = Query(
        None,
        description="Filter memories created before this date (timestamp)",
        examples=[1718505600]
    ),
    categories: Optional[str] = None,
    params: Params = Depends(),
    search_query: Optional[str] = None,
    sort_column: Optional[str] = Query(None, description="Column to sort by (memory, categories, app_name, created_at)"),
    sort_direction: Optional[str] = Query(None, description="Sort direction (asc or desc)"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build base query
    query = db.query(Memory).filter(
        Memory.user_id == user.id,
        Memory.state != MemoryState.deleted,
        Memory.state != MemoryState.archived,
        Memory.content.ilike(f"%{search_query}%") if search_query else True
    )

    # Apply filters
    if app_id:
        query = query.filter(Memory.app_id == app_id)

    if from_date:
        from_datetime = datetime.fromtimestamp(from_date, tz=timezone.utc)
        query = query.filter(Memory.created_at >= from_datetime)

    if to_date:
        to_datetime = datetime.fromtimestamp(to_date, tz=timezone.utc)
        query = query.filter(Memory.created_at <= to_datetime)

    # Add joins for app and categories after filtering
    query = query.outerjoin(App, Memory.app_id == App.id)
    query = query.outerjoin(Memory.categories)

    # Apply category filter if provided
    if categories:
        category_list = [c.strip() for c in categories.split(",")]
        query = query.filter(Category.name.in_(category_list))

    # PostgreSQL 兼容：用子查询去重，避免 DISTINCT ON 与 ORDER BY 冲突
    subquery = query.with_entities(Memory.id).distinct().subquery()
    final_query = db.query(Memory).filter(Memory.id.in_(
        db.query(subquery.c.id)
    ))

    # 在去重后的查询上应用排序
    if sort_column:
        sort_field = getattr(Memory, sort_column, None)
        if sort_field:
            final_query = final_query.order_by(sort_field.desc()) if sort_direction == "desc" else final_query.order_by(sort_field.asc())

    # Add eager loading for app and categories
    final_query = final_query.options(
        joinedload(Memory.app),
        joinedload(Memory.categories)
    )

    # Get paginated results with transformer
    return sqlalchemy_paginate(
        final_query,
        params,
        transformer=lambda items: [
            MemoryResponse(
                id=memory.id,
                content=memory.content,
                created_at=memory.created_at,
                state=memory.state.value,
                app_id=memory.app_id,
                app_name=memory.app.name if memory.app else None,
                categories=[category.name for category in memory.categories],
                metadata_=memory.metadata_
            )
            for memory in items
            if check_memory_access_permissions(db, memory, app_id)
        ]
    )


# Get all categories
@router.get("/categories", summary="获取分类列表", description="获取用户记忆的所有分类列表")
async def get_categories(
    user_id: str,
    db: Session = Depends(get_db)
):
    import re

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get unique categories associated with the user's memories
    # Get all memories
    memories = db.query(Memory).filter(Memory.user_id == user.id, Memory.state != MemoryState.deleted, Memory.state != MemoryState.archived).all()
    # Get all categories from memories
    raw_categories = [category for memory in memories for category in memory.categories]

    # 对分类名做拆分和去重处理
    invalid_names = {'none', 'n/a', 'unknown', 'undefined', '无', '未知'}
    seen_names = set()
    unique_categories = []
    for cat in raw_categories:
        # 按逗号、&、and 等分隔符拆分复合分类
        sub_names = re.split(r'\s*[,，]\s*|\s*&\s*|\s+and\s+', cat.name)
        for sub in sub_names:
            cleaned = sub.strip().lower()
            if not cleaned:
                continue
            if cleaned in invalid_names:
                continue
            if re.match(r'^[^\w]+$', cleaned):
                continue
            if cleaned not in seen_names:
                seen_names.add(cleaned)
                unique_categories.append({"id": str(cat.id), "name": cleaned, "description": cat.description or "", "created_at": str(cat.created_at), "updated_at": str(cat.updated_at)})

    # 检查是否有没有分类的记忆，如果有则添加 "null" 标签
    has_uncategorized = any(len(memory.categories) == 0 for memory in memories)
    if has_uncategorized and 'null' not in seen_names:
        unique_categories.append({"id": "null", "name": "null", "description": "未分类记忆", "created_at": "", "updated_at": ""})
        seen_names.add('null')

    # 按首字母排序，null 标签排在最后
    unique_categories.sort(key=lambda x: (x["name"] == "null", x["name"].lower()))

    return {
        "categories": unique_categories,
        "total": len(unique_categories)
    }


class CreateMemoryRequest(BaseModel):
    user_id: str
    text: str
    metadata: dict = {}
    infer: bool = True
    app: str = "openmemory"


# Create new memory
@router.post("/", summary="创建新记忆", description="创建一条新的记忆，支持自动推断和自定义元数据")
async def create_memory(
    request: CreateMemoryRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Get or create app
    app_obj = db.query(App).filter(App.name == request.app,
                                   App.owner_id == user.id).first()
    if not app_obj:
        app_obj = App(name=request.app, owner_id=user.id)
        db.add(app_obj)
        db.commit()
        db.refresh(app_obj)

    # Check if app is active
    if not app_obj.is_active:
        raise HTTPException(status_code=403, detail=f"App {request.app} is currently inactive on OpenMemory. Cannot create new memories.")

    # Log what we're about to do
    logging.info(f"Creating memory for user_id: {request.user_id} with app: {request.app}")
    
    # Try to get memory client safely
    try:
        memory_client = get_memory_client()
        if not memory_client:
            raise Exception("Memory client is not available")
    except Exception as client_error:
        logging.warning(f"Memory client unavailable: {client_error}. Creating memory in database only.")
        # Return a json response with the error
        return {
            "error": str(client_error)
        }

    # 尝试通过 memory_client 保存到向量存储
    try:
        vector_response = memory_client.add(
            request.text,
            user_id=request.user_id,  # Use string user_id to match search
            metadata={
                "source_app": "openmemory",
                "mcp_client": request.app,
            },
            infer=request.infer
        )
        
        # Log the response for debugging
        logging.info(f"Vector store response: {vector_response}")
        
        # Process vector store response
        if isinstance(vector_response, dict) and 'results' in vector_response:
            created_memories = []
            
            for result in vector_response['results']:
                if result['event'] == 'ADD':
                    # Get the Qdrant-generated ID
                    memory_id = UUID(result['id'])
                    
                    # Check if memory already exists
                    existing_memory = db.query(Memory).filter(Memory.id == memory_id).first()
                    
                    if existing_memory:
                        # Update existing memory
                        existing_memory.state = MemoryState.active
                        existing_memory.content = result['memory']
                        memory = existing_memory
                    else:
                        # Create memory with the EXACT SAME ID from Qdrant
                        memory = Memory(
                            id=memory_id,  # Use the same ID that Qdrant generated
                            user_id=user.id,
                            app_id=app_obj.id,
                            content=result['memory'],
                            metadata_=request.metadata,
                            state=MemoryState.active
                        )
                        db.add(memory)
                    
                    # Create history entry
                    history = MemoryStatusHistory(
                        memory_id=memory_id,
                        changed_by=user.id,
                        old_state=MemoryState.deleted if existing_memory else MemoryState.deleted,
                        new_state=MemoryState.active
                    )
                    db.add(history)
                    
                    created_memories.append(memory)
            
            # Commit all changes at once
            if created_memories:
                db.commit()
                for memory in created_memories:
                    db.refresh(memory)
                
                # Return the first memory (for API compatibility)
                # but all memories are now saved to the database
                return created_memories[0]
    except Exception as vector_error:
        logging.warning(f"Vector store operation failed: {vector_error}.")
        # Return a json response with the error
        return {
            "error": str(vector_error)
        }




# Get memory by ID
@router.get("/{memory_id}", summary="获取记忆详情", description="根据记忆ID获取单条记忆的详细信息")
async def get_memory(
    memory_id: UUID,
    db: Session = Depends(get_db)
):
    memory = get_memory_or_404(db, memory_id)
    return {
        "id": memory.id,
        "text": memory.content,
        "created_at": int(memory.created_at.timestamp()),
        "state": memory.state.value,
        "app_id": memory.app_id,
        "app_name": memory.app.name if memory.app else None,
        "categories": [category.name for category in memory.categories],
        "metadata_": memory.metadata_
    }


class DeleteMemoriesRequest(BaseModel):
    memory_ids: List[UUID]
    user_id: str

# Delete multiple memories
@router.delete("/", summary="批量删除记忆", description="批量删除指定的多条记忆，同时从向量存储中移除")
async def delete_memories(
    request: DeleteMemoriesRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get memory client to delete from vector store
    try:
        memory_client = get_memory_client()
        if not memory_client:
            raise HTTPException(
                status_code=503,
                detail="Memory client is not available"
            )
    except HTTPException:
        raise
    except Exception as client_error:
        logging.error(f"Memory client initialization failed: {client_error}")
        raise HTTPException(
            status_code=503,
            detail=f"Memory service unavailable: {str(client_error)}"
        )

    # Delete from vector store then mark as deleted in database
    for memory_id in request.memory_ids:
        try:
            memory_client.delete(str(memory_id))
        except Exception as delete_error:
            logging.warning(f"Failed to delete memory {memory_id} from vector store: {delete_error}")

        update_memory_state(db, memory_id, MemoryState.deleted, user.id)

    return {"message": f"Successfully deleted {len(request.memory_ids)} memories"}


class ArchiveMemoriesRequest(BaseModel):
    memory_ids: List[UUID]
    user_id: str


# Archive memories
@router.post("/actions/archive", summary="归档记忆", description="将指定的记忆标记为归档状态")
async def archive_memories(
    request: ArchiveMemoriesRequest,
    db: Session = Depends(get_db)
):
    for memory_id in request.memory_ids:
        update_memory_state(db, memory_id, MemoryState.archived, request.user_id)
    return {"message": f"Successfully archived {len(request.memory_ids)} memories"}


# Get memory access logs
@router.get("/{memory_id}/access-log", summary="获取记忆访问日志", description="获取指定记忆的访问日志记录，支持分页")
async def get_memory_access_log(
    memory_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(MemoryAccessLog).filter(MemoryAccessLog.memory_id == memory_id)
    total = query.count()
    logs = query.order_by(MemoryAccessLog.accessed_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Get app name
    for log in logs:
        app = db.query(App).filter(App.id == log.app_id).first()
        log.app_name = app.name if app else None

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "logs": logs
    }


class UpdateMemoryRequest(BaseModel):
    memory_content: str
    user_id: str

# Update a memory
@router.put("/{memory_id}", summary="更新记忆内容", description="更新指定记忆的文本内容")
async def update_memory(
    memory_id: UUID,
    request: UpdateMemoryRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    memory = get_memory_or_404(db, memory_id)
    memory.content = request.memory_content
    db.commit()
    db.refresh(memory)
    return memory

class FilterMemoriesRequest(BaseModel):
    user_id: str
    page: int = 1
    size: int = 10
    search_query: Optional[str] = None
    app_ids: Optional[List[UUID]] = None
    category_ids: Optional[List[str]] = None  # 支持 UUID 字符串和 "null" 虚拟分类
    sort_column: Optional[str] = None
    sort_direction: Optional[str] = None
    from_date: Optional[int] = None
    to_date: Optional[int] = None
    show_archived: Optional[bool] = False

@router.post("/filter", response_model=Page[MemoryResponse], summary="筛选记忆", description="通过多条件组合筛选记忆，支持按应用、分类、时间范围、关键词筛选，支持排序和分页")
async def filter_memories(
    request: FilterMemoriesRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build base query
    query = db.query(Memory).filter(
        Memory.user_id == user.id,
        Memory.state != MemoryState.deleted,
    )

    # Filter archived memories based on show_archived parameter
    if not request.show_archived:
        query = query.filter(Memory.state != MemoryState.archived)

    # Apply search filter
    if request.search_query:
        query = query.filter(Memory.content.ilike(f"%{request.search_query}%"))

    # Apply app filter
    if request.app_ids:
        query = query.filter(Memory.app_id.in_(request.app_ids))

    # Add joins for app and categories
    query = query.outerjoin(App, Memory.app_id == App.id)

    # Apply category filter
    if request.category_ids:
        # 检查是否包含 "null" 虚拟分类（表示无分类的记忆）
        has_null_category = "null" in request.category_ids
        real_category_ids = [cid for cid in request.category_ids if cid != "null"]

        if real_category_ids and has_null_category:
            # 同时筛选有指定分类的记忆和无分类的记忆
            from sqlalchemy import or_, exists, select
            mem_cat_table = Memory.categories.property.secondary
            has_category_subq = exists(
                select(mem_cat_table.c.memory_id).where(
                    mem_cat_table.c.memory_id == Memory.id
                )
            )
            query = query.outerjoin(Memory.categories).filter(
                or_(
                    Category.id.in_([UUID(cid) for cid in real_category_ids]),
                    ~has_category_subq
                )
            )
        elif has_null_category:
            # 只筛选无分类的记忆
            from sqlalchemy import exists, select
            mem_cat_table = Memory.categories.property.secondary
            has_category_subq = exists(
                select(mem_cat_table.c.memory_id).where(
                    mem_cat_table.c.memory_id == Memory.id
                )
            )
            query = query.outerjoin(Memory.categories).filter(~has_category_subq)
        else:
            # 只筛选有指定分类的记忆
            query = query.join(Memory.categories).filter(Category.id.in_([UUID(cid) for cid in real_category_ids]))
    else:
        query = query.outerjoin(Memory.categories)

    # Apply date filters
    if request.from_date:
        from_datetime = datetime.fromtimestamp(request.from_date, tz=timezone.utc)
        query = query.filter(Memory.created_at >= from_datetime)

    if request.to_date:
        to_datetime = datetime.fromtimestamp(request.to_date, tz=timezone.utc)
        query = query.filter(Memory.created_at <= to_datetime)

    # 参数校验（排序在子查询去重后再应用）
    if request.sort_column and request.sort_direction:
        sort_direction = request.sort_direction.lower()
        if sort_direction not in ['asc', 'desc']:
            raise HTTPException(status_code=400, detail="Invalid sort direction")
        if request.sort_column not in ['memory', 'app_name', 'created_at']:
            raise HTTPException(status_code=400, detail="Invalid sort column")

    # PostgreSQL 兼容：用子查询去重，避免 DISTINCT ON 与 ORDER BY 冲突
    subquery = query.with_entities(Memory.id).distinct().subquery()
    final_query = db.query(Memory).filter(Memory.id.in_(
        db.query(subquery.c.id)
    ))

    # 重新应用排序
    if request.sort_column and request.sort_direction:
        sort_direction = request.sort_direction.lower()
        sort_mapping = {
            'memory': Memory.content,
            'app_name': App.name,
            'created_at': Memory.created_at
        }
        if request.sort_column in sort_mapping:
            sort_field = sort_mapping[request.sort_column]
            if request.sort_column == 'app_name':
                final_query = final_query.outerjoin(App, Memory.app_id == App.id)
            if sort_direction == 'desc':
                final_query = final_query.order_by(sort_field.desc())
            else:
                final_query = final_query.order_by(sort_field.asc())
        else:
            final_query = final_query.order_by(Memory.created_at.desc())
    else:
        final_query = final_query.order_by(Memory.created_at.desc())

    # Add eager loading for categories
    final_query = final_query.options(
        joinedload(Memory.app),
        joinedload(Memory.categories)
    )

    # Use fastapi-pagination's paginate function
    return sqlalchemy_paginate(
        final_query,
        Params(page=request.page, size=request.size),
        transformer=lambda items: [
            MemoryResponse(
                id=memory.id,
                content=memory.content,
                created_at=memory.created_at,
                state=memory.state.value,
                app_id=memory.app_id,
                app_name=memory.app.name if memory.app else None,
                categories=[category.name for category in memory.categories],
                metadata_=memory.metadata_
            )
            for memory in items
        ]
    )


@router.get("/{memory_id}/related", response_model=Page[MemoryResponse], summary="获取相关记忆", description="根据记忆的分类查找相关的记忆列表")
async def get_related_memories(
    memory_id: UUID,
    user_id: str,
    params: Params = Depends(),
    db: Session = Depends(get_db)
):
    # Validate user
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the source memory
    memory = get_memory_or_404(db, memory_id)
    
    # Extract category IDs from the source memory
    category_ids = [category.id for category in memory.categories]
    
    if not category_ids:
        return Page.create([], total=0, params=params)
    
    # Build query for related memories
    # PostgreSQL 兼容：先用子查询去重和聚合，再加载关联数据
    sub = db.query(
        Memory.id.label('mem_id'),
        func.count(Category.id).label('cat_count')
    ).filter(
        Memory.user_id == user.id,
        Memory.id != memory_id,
        Memory.state != MemoryState.deleted
    ).join(Memory.categories).filter(
        Category.id.in_(category_ids)
    ).group_by(Memory.id).subquery()

    query = db.query(Memory).join(
        sub, Memory.id == sub.c.mem_id
    ).options(
        joinedload(Memory.categories),
        joinedload(Memory.app)
    ).order_by(
        sub.c.cat_count.desc(),
        Memory.created_at.desc()
    )
    
    # ⚡ Force page size to be 5
    params = Params(page=params.page, size=5)
    
    return sqlalchemy_paginate(
        query,
        params,
        transformer=lambda items: [
            MemoryResponse(
                id=memory.id,
                content=memory.content,
                created_at=memory.created_at,
                state=memory.state.value,
                app_id=memory.app_id,
                app_name=memory.app.name if memory.app else None,
                categories=[category.name for category in memory.categories],
                metadata_=memory.metadata_
            )
            for memory in items
        ]
    )
