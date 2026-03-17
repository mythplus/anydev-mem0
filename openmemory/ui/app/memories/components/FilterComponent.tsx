"use client";

import { ChevronDown, Filter, SortAsc, SortDesc, Check, X, Calendar } from "lucide-react";
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
import { constants as appConstants, Icon } from "@/components/shared/source-app";
import {
    clearFilters,
    setSelectedApps,
    setSelectedCategories,
    setDateRange,
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
  const [activeTab, setActiveTab] = useState<"apps" | "categories" | "dateRange">("apps");

  // 时间范围本地状态（用于输入，仅在点击应用时才提交）
  const [localStartDate, setLocalStartDate] = useState<string>("");
  const [localEndDate, setLocalEndDate] = useState<string>("");

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
    selectedCategories: string[],
    dateRange?: { startDate: string | null; endDate: string | null }
  ) => {
    const selectedCategoryIds = categories
      .filter((cat) => selectedCategories.includes(cat.name))
      .map((cat) => cat.id);
    const selectedAppIds = apps
      .filter((app) => selectedApps.includes(app.id))
      .map((app) => app.id);

    const effectiveDateRange = dateRange || filters.dateRange;
    const fromDate = effectiveDateRange.startDate
      ? Math.floor(new Date(effectiveDateRange.startDate).getTime() / 1000)
      : null;
    const toDate = effectiveDateRange.endDate
      ? Math.floor(new Date(effectiveDateRange.endDate + "T23:59:59").getTime() / 1000)
      : null;

    try {
      await fetchMemories(undefined, 1, 10, {
        apps: selectedAppIds,
        categories: selectedCategoryIds,
        sortColumn: filters.sortColumn,
        sortDirection: filters.sortDirection,
        showArchived: filters.showArchived,
        fromDate,
        toDate,
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
    setLocalStartDate("");
    setLocalEndDate("");
    await fetchMemories();
  };

  // 时间范围筛选回调
  const applyDateRange = async () => {
    const dateRange = {
      startDate: localStartDate || null,
      endDate: localEndDate || null,
    };
    dispatch(setDateRange(dateRange));
    await applyWithFilters(filters.selectedApps, filters.selectedCategories, dateRange);
  };

  const clearDateRange = async () => {
    setLocalStartDate("");
    setLocalEndDate("");
    const dateRange = { startDate: null, endDate: null };
    dispatch(setDateRange(dateRange));
    await applyWithFilters(filters.selectedApps, filters.selectedCategories, dateRange);
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

    const fromDate = filters.dateRange.startDate
      ? Math.floor(new Date(filters.dateRange.startDate).getTime() / 1000)
      : null;
    const toDate = filters.dateRange.endDate
      ? Math.floor(new Date(filters.dateRange.endDate + "T23:59:59").getTime() / 1000)
      : null;

    try {
      await fetchMemories(undefined, 1, 10, {
        apps: selectedAppIds,
        categories: selectedCategoryIds,
        sortColumn: column,
        sortDirection: newDirection,
        fromDate,
        toDate,
      });
    } catch (error) {
      console.error("Failed to apply sorting:", error);
    }
  };

  const appFilterCount = filters.selectedApps.length;
  const categoryFilterCount = filters.selectedCategories.length;
  const dateFilterCount = (filters.dateRange.startDate || filters.dateRange.endDate) ? 1 : 0;
  const totalFilterCount = appFilterCount + categoryFilterCount + dateFilterCount;

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
            <button
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === "dateRange"
                  ? "text-primary"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => setActiveTab("dateRange")}
            >
              {t("filter.dateRange")}
              {dateFilterCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {dateFilterCount}
                </span>
              )}
              {activeTab === "dateRange" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* Tab 内容区 */}
          <div className="max-h-[600px] overflow-y-auto">
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
                {apps.map((app) => {
                  const appConst = appConstants[app.name as keyof typeof appConstants];
                  const displayName = appConst ? appConst.name : app.name;
                  return (
                    <DropdownMenuItem
                      key={app.id}
                      className="cursor-pointer flex justify-between items-center px-4 py-2"
                      onSelect={(e) => {
                        e.preventDefault();
                        toggleAppFilter(app.id);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {appConst && appConst.icon}
                        {displayName}
                      </span>
                      {filters.selectedApps.includes(app.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
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

            {activeTab === "dateRange" && (
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">{t("filter.startDate")}</label>
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">{t("filter.endDate")}</label>
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={applyDateRange}
                    disabled={!localStartDate && !localEndDate}
                    className="flex-1 h-9 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("filter.applyDateRange")}
                  </button>
                  {(localStartDate || localEndDate || filters.dateRange.startDate || filters.dateRange.endDate) && (
                    <button
                      onClick={clearDateRange}
                      className="h-9 px-3 rounded-md border border-zinc-700 text-zinc-400 text-sm hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {filters.dateRange.startDate || filters.dateRange.endDate ? (
                  <div className="text-xs text-zinc-500 pt-1">
                    {filters.dateRange.startDate && filters.dateRange.endDate
                      ? `${filters.dateRange.startDate} ~ ${filters.dateRange.endDate}`
                      : filters.dateRange.startDate
                        ? `${filters.dateRange.startDate} ~`
                        : `~ ${filters.dateRange.endDate}`}
                  </div>
                ) : null}
              </div>
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
