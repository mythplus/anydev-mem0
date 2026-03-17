"use client";

import { useEffect } from "react";
import { MemoriesSection } from "@/app/memories/components/MemoriesSection";
import { MemoryFilters } from "@/app/memories/components/MemoryFilters";
import { CreateMemoryDialog } from "@/app/memories/components/CreateMemoryDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@/styles/animation.css";
import UpdateMemory from "@/components/shared/update-memory";
import { useUI } from "@/hooks/useUI";

export default function MemoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateMemoryDialog, handleCloseUpdateMemoryDialog } = useUI();
  const { fetchMemories } = useMemoriesApi();
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

  const handleRefresh = async () => {
    await fetchMemories();
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
          {/* 刷新(左) 和 创建记忆(右) - 固定在搜索框上方 */}
          <div className="flex items-center justify-between mb-4 animate-fade-slide-down">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-primary hover:bg-primary/90 text-white gap-1.5"
            >
              <RefreshCcw className="size-4" />
              {t("nav.refresh")}
            </Button>
            <CreateMemoryDialog />
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
