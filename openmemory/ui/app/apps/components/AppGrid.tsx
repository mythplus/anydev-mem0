"use client";
import { useAppsApi } from "@/hooks/useAppsApi";
import { useLanguage } from "@/lib/LanguageContext";
import { AppCardSkeleton } from "@/skeleton/AppCardSkeleton";
import { RootState } from "@/store/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { AppCard } from "./AppCard";

export function AppGrid() {
  const { fetchApps } = useAppsApi();
  const { t } = useLanguage();
  const apps = useSelector((state: RootState) => state.apps.apps);
  const filters = useSelector((state: RootState) => state.apps.filters);
  // 是否是首次加载（还没有拿到过数据）
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // 后续刷新时的 fetching 状态
  const [isFetching, setIsFetching] = useState(false);

  // 监听记忆变更触发器，同步更新应用页面的记忆数量
  const refreshTrigger = useSelector((state: RootState) => state.memories.refreshTrigger);

  const loadApps = useCallback(async () => {
    setIsFetching(true);
    try {
      await fetchApps({
        name: filters.searchQuery,
        is_active: filters.isActive === "all" ? undefined : filters.isActive,
        sort_by: filters.sortBy,
        sort_direction: filters.sortDirection,
      });
    } finally {
      setIsInitialLoad(false);
      setIsFetching(false);
    }
  }, [fetchApps, filters]);

  useEffect(() => {
    loadApps();
  }, [loadApps, refreshTrigger]);

  // 首次加载显示 skeleton
  if (isInitialLoad) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <AppCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-8">
        {t("apps.noApps")}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 后续刷新时显示半透明遮罩，保留已有内容 */}
      {isFetching && (
        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg loading-overlay">
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-300">{t("loading") || "加载中..."}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
