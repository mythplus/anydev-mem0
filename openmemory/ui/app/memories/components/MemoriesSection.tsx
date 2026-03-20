import { Button } from "@/components/ui/button";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import { MemoryTableSkeleton } from "@/skeleton/MemoryTableSkeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Category, Client } from "../../../components/types";
import { CreateMemoryDialog } from "./CreateMemoryDialog";
import { MemoryPagination } from "./MemoryPagination";
import { MemoryTable } from "./MemoryTable";
import { PageSizeSelector } from "./PageSizeSelector";

export function MemoriesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchMemories } = useMemoriesApi();
  const { t } = useLanguage();
  const [memories, setMemories] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = Number(searchParams.get("size")) || 10;
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );
  const [selectedClient, setSelectedClient] = useState<Client | "all">("all");

  // 监听 Redux store 中的刷新触发器，当创建/删除/更新记忆后自动重新加载列表
  const refreshTrigger = useSelector((state: RootState) => state.memories.refreshTrigger);

  // 监听 Redux store 中的筛选状态
  const activeFilters = useSelector((state: RootState) => state.filters.apps);

  // 使用 ref 持有最新的 filters，避免 fetchMemories 的 useCallback 依赖导致无限循环
  const filtersRef = useRef(activeFilters);
  filtersRef.current = activeFilters;

  useEffect(() => {
    const loadMemories = async () => {
      setIsLoading(true);
      try {
        const searchQuery = searchParams.get("search") || "";
        const filters = filtersRef.current;
        const result = await fetchMemories(
          searchQuery,
          currentPage,
          itemsPerPage,
          {
            apps: filters.selectedApps.length > 0 ? filters.selectedApps : undefined,
            categories: filters.selectedCategories.length > 0 ? filters.selectedCategories : undefined,
            sortColumn: filters.sortColumn,
            sortDirection: filters.sortDirection,
            showArchived: filters.showArchived,
            fromDate: filters.dateRange.startDate ? Math.floor(new Date(filters.dateRange.startDate).getTime() / 1000) : null,
            toDate: filters.dateRange.endDate ? Math.floor(new Date(filters.dateRange.endDate).getTime() / 1000) : null,
          }
        );
        setMemories(result.memories);
        setTotalItems(result.total);
        setTotalPages(result.pages);
      } catch (error) {
        console.error("Failed to fetch memories:", error);
      }
      setIsLoading(false);
    };

    loadMemories();
  }, [currentPage, itemsPerPage, fetchMemories, searchParams, refreshTrigger, activeFilters]);

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

  if (isLoading) {
    return (
      <div className="w-full bg-transparent">
        <MemoryTableSkeleton />
        <div className="flex items-center justify-between mt-4">
          <div className="h-8 w-32 rounded skeleton-shimmer" />
          <div className="h-8 w-48 rounded skeleton-shimmer" />
          <div className="h-8 w-32 rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent">
      <div>
        {memories.length > 0 ? (
          <>
            <MemoryTable />
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
              <PageSizeSelector
                pageSize={itemsPerPage}
                onPageSizeChange={handlePageSizeChange}
              />
              <div className="text-sm text-zinc-500 text-center order-first sm:order-none">
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-zinc-800/60 p-4 mb-5 empty-state-bounce">
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
                className="h-6 w-6 text-zinc-400"
              >
                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                <path d="M16 2v6h6"></path>
                <path d="M12 18v-6"></path>
                <path d="M9 15h6"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium">{t("memories.noMemories")}</h3>
            <p className="text-zinc-400 mt-1 mb-4">
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
