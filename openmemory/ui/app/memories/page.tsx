"use client";

import { useEffect } from "react";
import { MemoriesSection } from "@/app/memories/components/MemoriesSection";
import { MemoryFilters } from "@/app/memories/components/MemoryFilters";
import { CreateMemoryDialog } from "@/app/memories/components/CreateMemoryDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@/styles/animation.css";
import UpdateMemory from "@/components/shared/update-memory";
import { useUI } from "@/hooks/useUI";
import { useDispatch } from "react-redux";
import { triggerRefresh } from "@/store/memoriesSlice";

export default function MemoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateMemoryDialog, handleCloseUpdateMemoryDialog } = useUI();
  const dispatch = useDispatch();
  const { t } = useLanguage();

  useEffect(() => {
    // Set default pagination values if not present in URL
    if (!searchParams.has("page") || !searchParams.has("size")) {
      const params = new URLSearchParams(searchParams.toString());
      if (!searchParams.has("page")) params.set("page", "1");
      if (!searchParams.has("size")) params.set("size", "10");
      router.push(`?${params.toString()}`);
    }
  }, []);

  const handleRefresh = () => {
    dispatch(triggerRefresh());
  };

  return (
    <div className="">
      <UpdateMemory
        memoryId={updateMemoryDialog.memoryId || ""}
        memoryContent={updateMemoryDialog.memoryContent || ""}
        open={updateMemoryDialog.isOpen}
        onOpenChange={handleCloseUpdateMemoryDialog}
      />
      <main className="flex-1 py-6">
        <div className="container">
          {/* 创建记忆 + 刷新 - 固定在搜索框上方左侧 */}
          <div className="flex items-center gap-2 mb-4 animate-fade-slide-down">
            <CreateMemoryDialog />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-primary hover:bg-primary/90 text-white gap-1.5"
            >
              <RefreshCcw className="size-4" />
              {t("nav.refresh")}
            </Button>
          </div>
          <div className="mt-1 pb-4 animate-fade-slide-down">
            <MemoryFilters />
          </div>
          <div className="animate-fade-slide-down delay-1">
            <MemoriesSection />
          </div>
        </div>
      </main>
    </div>
  );
}
