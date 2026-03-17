"use client";

import { ChevronDown, Filter, SortAsc, SortDesc, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppsApi } from "@/hooks/useAppsApi";
import { useFiltersApi } from "@/hooks/useFiltersApi";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import {
    clearFilters,
    setSelectedApps,
    setSelectedCategories,
} from "@/store/filtersSlice";
import { RootState } from "@/store/store";

function getColumns(t: (key: string) => string) {
  return [
    {
      label: t("filter.columnMemory"),
      value: "memory",
    },
    {
      label: t("filter.columnAppName"),
      value: "app_name",
    },
    {
      label: t("filter.columnCreatedOn"),
      value: "created_at",
    },
  ];
}

export default function FilterComponent() {
  const dispatch = useDispatch();
  const { fetchApps } = useAppsApi();
  const { fetchCategories, updateSort } = useFiltersApi();
  const { fetchMemories } = useMemoriesApi();
  const { t } = useLanguage();
  const columns = getColumns(t);

  const apps = useSelector((state: RootState) => state.apps.apps);
  const categories = useSelector(
    (state: RootState) => state.filters.categories.items
  );
  const filters = useSelector((state: RootState) => state.filters.apps);

  // 控制筛选下拉菜单和内部 Tab
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"apps" | "categories">("apps");

  useEffect(() => {
    fetchApps();
    fetchCategories();
  }, [fetchApps, fetchCategories]);

  useEffect(() => {
    handleClearFilters();
  }, []);

  // 应用筛选相关的回调
  const applyWithFilters = async (
    selectedApps: string[],
    selectedCategories: string[]
  ) => {
    const selectedCategoryIds = categories
      .filter((cat) => selectedCategories.includes(cat.name))
      .map((cat) => cat.id);
    const selectedAppIds = apps
      .filter((app) => selectedApps.includes(app.id))
      .map((app) => app.id);

    try {
      await fetchMemories(undefined, 1, 10, {
        apps: selectedAppIds,
        categories: selectedCategoryIds,
        sortColumn: filters.sortColumn,
        sortDirection: filters.sortDirection,
        showArchived: filters.showArchived,
      });
    } catch (error) {
      console.error("Failed to apply filters:", error);
    }
  };

  const toggleAppFilter = async (appId: string) => {
    const newSelected = filters.selectedApps.includes(appId)
      ? filters.selectedApps.filter((a) => a !== appId)
      : [...filters.selectedApps, appId];
    dispatch(setSelectedApps(newSelected));
    await applyWithFilters(newSelected, filters.selectedCategories);
  };

  const toggleAllApps = async (selectAll: boolean) => {
    const newSelected = selectAll ? apps.map((app) => app.id) : [];
    dispatch(setSelectedApps(newSelected));
    await applyWithFilters(newSelected, filters.selectedCategories);
  };

  const toggleCategoryFilter = async (categoryName: string) => {
    const newSelected = filters.selectedCategories.includes(categoryName)
      ? filters.selectedCategories.filter((c) => c !== categoryName)
      : [...filters.selectedCategories, categoryName];
    dispatch(setSelectedCategories(newSelected));
    await applyWithFilters(filters.selectedApps, newSelected);
  };

  const toggleAllCategories = async (selectAll: boolean) => {
    const newSelected = selectAll ? categories.map((cat) => cat.name) : [];
    dispatch(setSelectedCategories(newSelected));
    await applyWithFilters(filters.selectedApps, newSelected);
  };

  const handleClearFilters = async () => {
    dispatch(clearFilters());
    await fetchMemories();
  };

  const setSorting = async (column: string) => {
    const newDirection =
      filters.sortColumn === column && filters.sortDirection === "asc"
        ? "desc"
        : "asc";
    updateSort(column, newDirection);

    const selectedCategoryIds = categories
      .filter((cat) => filters.selectedCategories.includes(cat.name))
      .map((cat) => cat.id);
    const selectedAppIds = apps
      .filter((app) => filters.selectedApps.includes(app.id))
      .map((app) => app.id);

    try {
      await fetchMemories(undefined, 1, 10, {
        apps: selectedAppIds,
        categories: selectedCategoryIds,
        sortColumn: column,
        sortDirection: newDirection,
      });
    } catch (error) {
      console.error("Failed to apply sorting:", error);
    }
  };

  const appFilterCount = filters.selectedApps.length;
  const categoryFilterCount = filters.selectedCategories.length;
  const totalFilterCount = appFilterCount + categoryFilterCount;

  // 获取筛选按钮显示文本
  const getFilterLabel = () => {
    if (totalFilterCount === 0) return t("filter.button");
    return `${t("filter.button")} (${totalFilterCount})`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* 合并的筛选下拉 */}
      <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`h-9 px-4 border-zinc-700/50 bg-zinc-900 hover:bg-zinc-800 ${
              totalFilterCount > 0 ? "border-primary" : ""
            }`}
          >
            <Filter
              className={`h-4 w-4 ${totalFilterCount > 0 ? "text-primary" : ""}`}
            />
            {getFilterLabel()}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 bg-zinc-900 border-zinc-800 text-zinc-100 p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Tab 切换栏 */}
          <div className="flex border-b border-zinc-800">
            <button
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === "apps"
                  ? "text-primary"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => setActiveTab("apps")}
            >
              {t("filter.apps")}
              {appFilterCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {appFilterCount}
                </span>
              )}
              {activeTab === "apps" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === "categories"
                  ? "text-primary"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => setActiveTab("categories")}
            >
              {t("filter.categories")}
              {categoryFilterCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {categoryFilterCount}
                </span>
              )}
              {activeTab === "categories" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* Tab 内容区 */}
          <div className="max-h-[300px] overflow-y-auto">
            {activeTab === "apps" && (
              <DropdownMenuGroup>
                {/* 全选 */}
                <DropdownMenuItem
                  className="cursor-pointer flex justify-between items-center px-4 py-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleAllApps(
                      !(apps.length > 0 && filters.selectedApps.length === apps.length)
                    );
                  }}
                >
                  {t("filter.selectAll")}
                  {apps.length > 0 && filters.selectedApps.length === apps.length && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
                {/* 清除筛选 */}
                {appFilterCount > 0 && (
                  <DropdownMenuItem
                    className="cursor-pointer flex justify-between items-center px-4 py-2 text-zinc-400 hover:text-zinc-200"
                    onSelect={() => {
                      toggleAllApps(false);
                      setFilterOpen(false);
                    }}
                  >
                    {t("memories.clearFilters")}
                    <X className="h-4 w-4" />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-zinc-800" />
                {apps.map((app) => (
                  <DropdownMenuItem
                    key={app.id}
                    className="cursor-pointer flex justify-between items-center px-4 py-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleAppFilter(app.id);
                    }}
                  >
                    {app.name}
                    {filters.selectedApps.includes(app.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}

            {activeTab === "categories" && (
              <DropdownMenuGroup>
                {/* 全选 */}
                <DropdownMenuItem
                  className="cursor-pointer flex justify-between items-center px-4 py-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleAllCategories(
                      !(categories.length > 0 && filters.selectedCategories.length === categories.length)
                    );
                  }}
                >
                  {t("filter.selectAll")}
                  {categories.length > 0 &&
                    filters.selectedCategories.length === categories.length && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                </DropdownMenuItem>
                {/* 清除筛选 */}
                {categoryFilterCount > 0 && (
                  <DropdownMenuItem
                    className="cursor-pointer flex justify-between items-center px-4 py-2 text-zinc-400 hover:text-zinc-200"
                    onSelect={() => {
                      toggleAllCategories(false);
                      setFilterOpen(false);
                    }}
                  >
                    {t("memories.clearFilters")}
                    <X className="h-4 w-4" />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-zinc-800" />
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.name}
                    className="cursor-pointer flex justify-between items-center px-4 py-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleCategoryFilter(category.name);
                    }}
                  >
                    {category.name}
                    {filters.selectedCategories.includes(category.name) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 排序下拉 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-4 border-zinc-700/50 bg-zinc-900 hover:bg-zinc-800"
          >
            {filters.sortDirection === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
            {t("filter.sort")}: {columns.find((c) => c.value === filters.sortColumn)?.label}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-100">
          <DropdownMenuLabel>{t("filter.sortBy")}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuGroup>
            {columns.map((column) => (
              <DropdownMenuItem
                key={column.value}
                onClick={() => setSorting(column.value)}
                className="cursor-pointer flex justify-between items-center"
              >
                {column.label}
                {filters.sortColumn === column.value &&
                  (filters.sortDirection === "asc" ? (
                    <SortAsc className="h-4 w-4 text-primary" />
                  ) : (
                    <SortDesc className="h-4 w-4 text-primary" />
                  ))}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
