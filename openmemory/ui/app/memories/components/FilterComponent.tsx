"use client";

import { ChevronDown, Filter, SortAsc, SortDesc, Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

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
import { useLanguage } from "@/lib/LanguageContext";
import { constants as appConstants } from "@/components/shared/source-app";
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

  // 只在首次打开筛选面板时加载 apps/categories 数据，避免页面加载时就发请求
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (filterOpen && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchApps();
      fetchCategories();
    }
  }, [filterOpen, fetchApps, fetchCategories]);

  // 筛选变更 -> 只更新 Redux 状态 -> MemoriesSection 自动监听 activeFilters 变化来刷新
  // 不再在这里直接调 fetchMemories，彻底消除重复请求

  const toggleAppFilter = useCallback((appId: string) => {
    const newSelected = filters.selectedApps.includes(appId)
      ? filters.selectedApps.filter((a) => a !== appId)
      : [...filters.selectedApps, appId];
    dispatch(setSelectedApps(newSelected));
  }, [filters.selectedApps, dispatch]);

  const toggleAllApps = useCallback((selectAll: boolean) => {
    const newSelected = selectAll ? apps.map((app) => app.id) : [];
    dispatch(setSelectedApps(newSelected));
  }, [apps, dispatch]);

  const toggleCategoryFilter = useCallback((categoryName: string) => {
    const newSelected = filters.selectedCategories.includes(categoryName)
      ? filters.selectedCategories.filter((c) => c !== categoryName)
      : [...filters.selectedCategories, categoryName];
    dispatch(setSelectedCategories(newSelected));
  }, [filters.selectedCategories, dispatch]);

  const toggleAllCategories = useCallback((selectAll: boolean) => {
    const newSelected = selectAll ? categories.map((cat) => cat.name) : [];
    dispatch(setSelectedCategories(newSelected));
  }, [categories, dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    setLocalStartDate("");
    setLocalEndDate("");
  }, [dispatch]);

  // 时间范围筛选回调 - 只更新 Redux 状态
  const applyDateRange = useCallback(() => {
    const dateRange = {
      startDate: localStartDate || null,
      endDate: localEndDate || null,
    };
    dispatch(setDateRange(dateRange));
  }, [localStartDate, localEndDate, dispatch]);

  const clearDateRange = useCallback(() => {
    setLocalStartDate("");
    setLocalEndDate("");
    const dateRange = { startDate: null, endDate: null };
    dispatch(setDateRange(dateRange));
  }, [dispatch]);

  const setSorting = useCallback((column: string) => {
    const newDirection =
      filters.sortColumn === column && filters.sortDirection === "asc"
        ? "desc"
        : "asc";
    updateSort(column, newDirection);
  }, [filters.sortColumn, filters.sortDirection, updateSort]);

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
          className="w-72 bg-zinc-900 border-zinc-800 text-zinc-100 p-0 shadow-xl shadow-black/20 rounded-lg overflow-hidden"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Tab 切换栏 */}
          <div className="flex border-b border-zinc-800/80">
            <button
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all duration-200 relative ${
                activeTab === "apps"
                  ? "text-primary"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => setActiveTab("apps")}
            >
              {t("filter.apps")}
              {appFilterCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  {appFilterCount}
                </span>
              )}
              {activeTab === "apps" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full tab-indicator" />
              )}
            </button>
            <button
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all duration-200 relative ${
                activeTab === "categories"
                  ? "text-primary"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => setActiveTab("categories")}
            >
              {t("filter.categories")}
              {categoryFilterCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  {categoryFilterCount}
                </span>
              )}
              {activeTab === "categories" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full tab-indicator" />
              )}
            </button>
            <button
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all duration-200 relative ${
                activeTab === "dateRange"
                  ? "text-primary"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => setActiveTab("dateRange")}
            >
              {t("filter.dateRange")}
              {dateFilterCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  {dateFilterCount}
                </span>
              )}
              {activeTab === "dateRange" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full tab-indicator" />
              )}
            </button>
          </div>

          {/* Tab 内容区 */}
          <div className="max-h-[600px] overflow-y-auto overflow-x-hidden scrollbar-thin">
            {activeTab === "apps" && (
              <DropdownMenuGroup className="tab-content-animate">
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
              <DropdownMenuGroup className="tab-content-animate">
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
              <div className="p-4 space-y-4 tab-content-animate">
                {/* 快捷选择按钮 */}
                <div className="flex gap-2">
                  {[
                    { label: t("filter.today"), days: 0 },
                    { label: t("filter.last7Days"), days: 7 },
                    { label: t("filter.last30Days"), days: 30 },
                  ].map(({ label, days }) => {
                    const today = new Date();
                    const todayStr = today.toISOString().split("T")[0];
                    const startDate = days === 0
                      ? todayStr
                      : new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                    const isActive = localStartDate === startDate && localEndDate === todayStr;
                    return (
                      <button
                        key={days}
                        onClick={() => {
                          setLocalStartDate(startDate);
                          setLocalEndDate(todayStr);
                          dispatch(setDateRange({ startDate, endDate: todayStr }));
                          setFilterOpen(false);
                        }}
                        className={`flex-1 h-8 rounded-md text-xs font-medium transition-all duration-200 border ${
                          isActive
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : "border-zinc-700/60 bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{t("filter.startDate")}</label>
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-700/60 bg-zinc-800/80 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{t("filter.endDate")}</label>
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-700/60 bg-zinc-800/80 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      applyDateRange();
                      setFilterOpen(false);
                    }}
                    disabled={!localStartDate && !localEndDate}
                    className="flex-1 h-9 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 btn-press"
                  >
                    {t("filter.applyDateRange")}
                  </button>
                  {(localStartDate || localEndDate || filters.dateRange.startDate || filters.dateRange.endDate) && (
                    <button
                      onClick={() => {
                        clearDateRange();
                        setFilterOpen(false);
                      }}
                      className="h-9 px-3 rounded-md border border-zinc-700/60 text-zinc-400 text-sm hover:text-zinc-200 hover:border-zinc-500 transition-all duration-200 btn-press"
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
            className="h-9 px-4 border-zinc-700/50 bg-zinc-900 hover:bg-zinc-800 transition-all duration-200 btn-press"
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
        <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl shadow-black/20">
          <DropdownMenuLabel className="text-zinc-400 text-xs uppercase tracking-wider">{t("filter.sortBy")}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuGroup>
            {columns.map((column) => (
              <DropdownMenuItem
                key={column.value}
                onClick={() => setSorting(column.value)}
                className="cursor-pointer flex justify-between items-center transition-colors duration-150"
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
