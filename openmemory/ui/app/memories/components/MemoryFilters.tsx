"use client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import { setShowArchived } from "@/store/filtersSlice";
import { clearSelection, triggerRefresh } from "@/store/memoriesSlice";
import { RootState } from "@/store/store";
import { debounce } from "lodash";
import { Archive, ChevronDown, Download, Search, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import FilterComponent from "./FilterComponent";

export function MemoryFilters() {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const selectedMemoryIds = useSelector(
    (state: RootState) => state.memories.selectedMemoryIds
  );
  const { deleteMemories, archiveMemories, updateMemoryState } = useMemoriesApi();
  const memories = useSelector((state: RootState) => state.memories.memories);
  const hasSelection = selectedMemoryIds.length > 0;
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilters = useSelector((state: RootState) => state.filters.apps);
  const showArchived = useSelector((state: RootState) => state.filters.apps.showArchived);

  const inputRef = useRef<HTMLInputElement>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const handleDeleteSelected = async () => {
    try {
      await deleteMemories(selectedMemoryIds);
      dispatch(clearSelection());
      dispatch(triggerRefresh());
    } catch (error) {
      console.error("Failed to delete memories:", error);
    }
    setBatchDeleteOpen(false);
  };

  const handleArchiveSelected = async () => {
    try {
      await archiveMemories(selectedMemoryIds);
      dispatch(clearSelection());
      dispatch(triggerRefresh());
    } catch (error) {
      console.error("Failed to archive memories:", error);
    }
  };

  const handleUnarchiveSelected = async () => {
    try {
      await updateMemoryState(selectedMemoryIds, "active");
      dispatch(clearSelection());
      dispatch(triggerRefresh());
    } catch (error) {
      console.error("Failed to unarchive memories:", error);
    }
  };

  const handleExportSelected = () => {
    const selectedMemories = memories.filter((m) =>
      selectedMemoryIds.includes(m.id)
    );
    const exportData = selectedMemories.map((m) => ({
      id: m.id,
      memory: m.memory,
      categories: m.categories,
      app_name: m.app_name,
      state: m.state,
      created_at: m.created_at,
      metadata: m.metadata,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memories-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // add debounce
  const handleSearch = debounce(async (query: string) => {
    router.push(`/memories?search=${query}`);
  }, 500);

  useEffect(() => {
    // if the url has a search param, set the input value to the search param
    if (searchParams.get("search")) {
      if (inputRef.current) {
        inputRef.current.value = searchParams.get("search") || "";
        inputRef.current.focus();
      }
    }
  }, []);

  const handleArchiveFilterChange = useCallback(async (archived: boolean) => {
    dispatch(setShowArchived(archived));
    dispatch(triggerRefresh());
  }, [dispatch]);



  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-200" />
        <Input
          ref={inputRef}
          placeholder={t("memories.searchPlaceholder")}
          className="pl-9 bg-zinc-950 border-zinc-800 w-full sm:max-w-[500px] focus:border-primary/40 transition-all duration-200"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 px-4 border-zinc-700/50 bg-zinc-900 hover:bg-zinc-800 transition-all duration-200 btn-press"
            >
              {showArchived ? t("filter.archived") : t("filter.notArchived")}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-zinc-900 border-zinc-800"
          >
            <DropdownMenuItem
              onClick={() => handleArchiveFilterChange(false)}
              className={!showArchived ? "text-primary" : ""}
            >
              {t("filter.notArchived")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleArchiveFilterChange(true)}
              className={showArchived ? "text-primary" : ""}
            >
              {t("filter.archived")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <FilterComponent />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`border-zinc-700/50 transition-all duration-200 btn-press ${
                hasSelection
                  ? "bg-primary/10 border-primary/50 hover:bg-primary/20"
                  : "bg-zinc-900 hover:bg-zinc-800 cursor-default"
              }`}
              disabled={!hasSelection}
            >
              {t("memories.batchActions")}
              {hasSelection && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {selectedMemoryIds.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-zinc-900 border-zinc-800"
          >
            <DropdownMenuItem
              onClick={() => dispatch(clearSelection())}
              className="transition-colors duration-150"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t("memories.clearSelection")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={showArchived ? handleUnarchiveSelected : handleArchiveSelected}
              disabled={selectedMemoryIds.length === 0}
              className="transition-colors duration-150"
            >
              <Archive className="mr-2 h-4 w-4" />
              {showArchived ? t("memories.unarchiveSelected") : t("memories.archiveSelected")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportSelected}
              disabled={selectedMemoryIds.length === 0}
              className="transition-colors duration-150"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("memories.exportSelected")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setBatchDeleteOpen(true)}
              disabled={selectedMemoryIds.length === 0}
              className="text-red-500 transition-colors duration-150 hover:bg-red-500/10"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              {t("memories.deleteSelected")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 批量删除确认弹窗 */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t("memories.batchDeleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t("memories.batchDeleteDesc").replace("{count}", String(selectedMemoryIds.length))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
              {t("table.deleteCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {t("table.deleteConfirmBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
