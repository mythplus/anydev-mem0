"use client";
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
import { clearFilters, setShowArchived } from "@/store/filtersSlice";
import { clearSelection, triggerRefresh } from "@/store/memoriesSlice";
import { RootState } from "@/store/store";
import { debounce } from "lodash";
import { Archive, ChevronDown, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import FilterComponent from "./FilterComponent";

export function MemoryFilters() {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const selectedMemoryIds = useSelector(
    (state: RootState) => state.memories.selectedMemoryIds
  );
  const { deleteMemories, archiveMemories, fetchMemories } = useMemoriesApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilters = useSelector((state: RootState) => state.filters.apps);
  const showArchived = useSelector((state: RootState) => state.filters.apps.showArchived);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDeleteSelected = async () => {
    try {
      await deleteMemories(selectedMemoryIds);
      dispatch(clearSelection());
      dispatch(triggerRefresh());
    } catch (error) {
      console.error("Failed to delete memories:", error);
    }
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

  const handleClearAllFilters = async () => {
    dispatch(clearFilters());
    await fetchMemories(); // Fetch memories without any filters
  };

  const hasActiveFilters =
    activeFilters.selectedApps.length > 0 ||
    activeFilters.selectedCategories.length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          ref={inputRef}
          placeholder={t("memories.searchPlaceholder")}
          className="pl-8 bg-zinc-950 border-zinc-800 max-w-[500px]"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 px-4 border-zinc-700/50 bg-zinc-900 hover:bg-zinc-800"
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
        {hasActiveFilters && (
          <Button
            variant="outline"
            className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 whitespace-nowrap"
            onClick={handleClearAllFilters}
          >
            {t("memories.clearFilters")}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-zinc-700/50 bg-zinc-900 hover:bg-zinc-800"
            >
              {t("memories.actions")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-zinc-900 border-zinc-800"
          >
            <DropdownMenuItem
              onClick={handleArchiveSelected}
              disabled={selectedMemoryIds.length === 0}
            >
              <Archive className="mr-2 h-4 w-4" />
              {t("memories.archiveSelected")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteSelected}
              disabled={selectedMemoryIds.length === 0}
              className="text-red-500"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              {t("memories.deleteSelected")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
