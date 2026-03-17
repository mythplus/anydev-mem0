"use client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import { clearFilters } from "@/store/filtersSlice";
import { clearSelection } from "@/store/memoriesSlice";
import { RootState } from "@/store/store";
import { Archive, Pause, Play } from "lucide-react";
import { FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import FilterComponent from "./FilterComponent";
import { EnhancedSearch } from "@/components/shared/EnhancedSearch";

export function MemoryFilters() {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const selectedMemoryIds = useSelector(
    (state: RootState) => state.memories.selectedMemoryIds
  );
  const { deleteMemories, updateMemoryState, fetchMemories } = useMemoriesApi();
  const activeFilters = useSelector((state: RootState) => state.filters.apps);

  const handleDeleteSelected = async () => {
    try {
      await deleteMemories(selectedMemoryIds);
      dispatch(clearSelection());
    } catch (error) {
      console.error("Failed to delete memories:", error);
    }
  };

  const handleArchiveSelected = async () => {
    try {
      await updateMemoryState(selectedMemoryIds, "archived");
    } catch (error) {
      console.error("Failed to archive memories:", error);
    }
  };

  const handlePauseSelected = async () => {
    try {
      await updateMemoryState(selectedMemoryIds, "paused");
    } catch (error) {
      console.error("Failed to pause memories:", error);
    }
  };

  const handleResumeSelected = async () => {
    try {
      await updateMemoryState(selectedMemoryIds, "active");
    } catch (error) {
      console.error("Failed to resume memories:", error);
    }
  };

  const handleClearAllFilters = async () => {
    dispatch(clearFilters());
    await fetchMemories(); // Fetch memories without any filters
  };

  const hasActiveFilters =
    activeFilters.selectedApps.length > 0 ||
    activeFilters.selectedCategories.length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <EnhancedSearch />
      <div className="flex gap-2">
        <FilterComponent />
        {hasActiveFilters && (
          <Button
            variant="outline"
            className="bg-card text-muted-foreground hover:bg-accent"
            onClick={handleClearAllFilters}
          >
            {t("memories.clearFilters")}
          </Button>
        )}
        {selectedMemoryIds.length > 0 && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-border bg-card hover:bg-accent"
                >
                  {t("memories.actions")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-popover border-border"
              >
                <DropdownMenuItem onClick={handleArchiveSelected}>
                  <Archive className="mr-2 h-4 w-4" />
                  {t("memories.archiveSelected")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePauseSelected}>
                  <Pause className="mr-2 h-4 w-4" />
                  {t("memories.pauseSelected")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleResumeSelected}>
                  <Play className="mr-2 h-4 w-4" />
                  {t("memories.resumeSelected")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteSelected}
                  className="text-red-500"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  {t("memories.deleteSelected")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}
