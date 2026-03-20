"use client";

import "@/styles/animation.css";
import { useEffect, useState } from "react";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { use } from "react";
import { MemorySkeleton } from "@/skeleton/MemorySkeleton";
import { MemoryDetails } from "./components/MemoryDetails";
import UpdateMemory from "@/components/shared/update-memory";
import { useUI } from "@/hooks/useUI";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import NotFound from "@/app/not-found";

function MemoryContent({ id }: { id: string }) {
  const { fetchMemoryById } = useMemoriesApi();
  const memory = useSelector(
    (state: RootState) => state.memories.selectedMemory
  );
  // 使用本地 loading/error 状态，与共享的 isLoading 解耦
  // 避免其他组件（如 AccessLog、RelatedMemories）调用 API 时干扰本页面 loading 显示
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemory = async () => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        await fetchMemoryById(id);
      } catch (err: any) {
        console.error("Failed to load memory:", err);
        setLocalError(err?.message || "Failed to load memory");
      } finally {
        setLocalLoading(false);
      }
    };
    loadMemory();
  }, [id, fetchMemoryById]);

  if (localLoading) {
    return <MemorySkeleton />;
  }

  if (localError) {
    return <NotFound message={localError} />;
  }

  if (!memory) {
    return <NotFound message="Memory not found" statusCode={404} />;
  }

  return <MemoryDetails memory_id={memory.id} />;
}

export default function MemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { updateMemoryDialog, handleCloseUpdateMemoryDialog } = useUI();
  return (
    <div>
      <div className="animate-fade-slide-down delay-1">
        <UpdateMemory
          memoryId={updateMemoryDialog.memoryId || ""}
          memoryContent={updateMemoryDialog.memoryContent || ""}
          open={updateMemoryDialog.isOpen}
          onOpenChange={handleCloseUpdateMemoryDialog}
        />
      </div>
      <div className="animate-fade-slide-down delay-2">
        <MemoryContent id={resolvedParams.id} />
      </div>
    </div>
  );
}
