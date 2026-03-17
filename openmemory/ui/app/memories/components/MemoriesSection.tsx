import { Button } from "@/components/ui/button";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import { MemoryTableSkeleton } from "@/skeleton/MemoryTableSkeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AppDispatch } from "@/store/store";
import { setOperationLoading } from "@/store/memoriesSlice";
import { Category, Client } from "../../../components/types";
import { CreateMemoryDialog } from "./CreateMemoryDialog";
import { MemoryPagination } from "./MemoryPagination";
import { MemoryTable } from "./MemoryTable";
import { PageSizeSelector } from "./PageSizeSelector";

export function MemoriesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { fetchMemories } = useMemoriesApi();
  const { t } = useLanguage();
  const [memories, setMemories] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = Number(searchParams.get("size")) || 10;
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );
  const [selectedClient, setSelectedClient] = useState<Client | "all">("all");

  // 监听 Redux store 中的刷新触发器和全局操作 loading 状态
  const refreshTrigger = useSelector((state: RootState) => state.memories.refreshTrigger);
  const operationLoading = useSelector((state: RootState) => state.memories.operationLoading);

  useEffect(() => {
    const loadMemories = async () => {
      setIsLoading(true);
      try {
        const searchQuery = searchParams.get("search") || "";
        const result = await fetchMemories(
          searchQuery,
          currentPage,
          itemsPerPage
        );
        setMemories(result.memories);
        setTotalItems(result.total);
        setTotalPages(result.pages);
      } catch (error) {
        console.error("Failed to fetch memories:", error);
      }
      setIsLoading(false);
      // 刷新完成后重置全局操作 loading 状态
      dispatch(setOperationLoading(false));
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    };

    loadMemories();
  }, [currentPage, itemsPerPage, fetchMemories, searchParams, refreshTrigger]);

  const setCurrentPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    params.set("size", itemsPerPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset to page 1 when changing page size
    params.set("size", size.toString());
    router.push(`?${params.toString()}`);
  };

  // 首次加载时显示骨架屏
  if (isLoading && isFirstLoad) {
    return (
      <div className="w-full bg-transparent">
        <MemoryTableSkeleton />
        <div className="flex items-center justify-between mt-4">
          <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
          <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
          <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent relative">
      {/* 刷新加载时显示半透明遮罩 + 转圈圈 */}
      {(isLoading || operationLoading) && !isFirstLoad && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-md">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-muted-foreground">{t("memories.loading") || "加载中..."}</span>
          </div>
        </div>
      )}
      <div>
        {memories.length > 0 ? (
          <>
            <MemoryTable />
            <div className="flex items-center justify-between mt-4">
              <PageSizeSelector
                pageSize={itemsPerPage}
                onPageSizeChange={handlePageSizeChange}
              />
              <div className="text-sm text-muted-foreground mr-2">
                {t("memories.showing")} {(currentPage - 1) * itemsPerPage + 1} {t("memories.to")}{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} {t("memories.of")}{" "}
                {totalItems} {t("memories.memoriesLabel")}
              </div>
              <MemoryPagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-secondary p-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-muted-foreground"
              >
                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                <path d="M16 2v6h6"></path>
                <path d="M12 18v-6"></path>
                <path d="M9 15h6"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium">{t("memories.noMemories")}</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              {selectedCategory !== "all" || selectedClient !== "all"
                ? t("memories.adjustFilters")
                : t("memories.createFirst")}
            </p>
            {selectedCategory !== "all" || selectedClient !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedClient("all");
                }}
              >
                {t("memories.clearFilters")}
              </Button>
            ) : (
              <CreateMemoryDialog />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
