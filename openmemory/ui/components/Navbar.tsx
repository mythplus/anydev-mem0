"use client";

import { CreateMemoryDialog } from "@/app/memories/components/CreateMemoryDialog";
import { Button } from "@/components/ui/button";
import { useAppsApi } from "@/hooks/useAppsApi";
import { useConfig } from "@/hooks/useConfig";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useStats } from "@/hooks/useStats";
import { useLanguage } from "@/lib/LanguageContext";
import { Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FiRefreshCcw } from "react-icons/fi";
import { HiHome, HiMiniRectangleStack } from "react-icons/hi2";
import { RiApps2AddFill } from "react-icons/ri";

export function Navbar() {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const memoriesApi = useMemoriesApi();
  const appsApi = useAppsApi();
  const statsApi = useStats();
  const configApi = useConfig();

  const { t } = useLanguage();

  // 用 ref 持有 API 函数的最新引用，避免 useMemo/useCallback 依赖导致频繁重建
  const memoriesApiRef = useRef(memoriesApi);
  memoriesApiRef.current = memoriesApi;
  const appsApiRef = useRef(appsApi);
  appsApiRef.current = appsApi;
  const statsApiRef = useRef(statsApi);
  statsApiRef.current = statsApi;
  const configApiRef = useRef(configApi);
  configApiRef.current = configApi;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetchers: (() => Promise<any>)[] = [];
      const api = memoriesApiRef.current;
      const apps = appsApiRef.current;
      const stats = statsApiRef.current;
      const config = configApiRef.current;

      // 根据当前路由决定刷新哪些数据
      const memoryMatch = pathname.match(/^\/memory\/([^/]+)$/);
      const appMatch = pathname.match(/^\/apps\/([^/]+)$/);

      if (memoryMatch) {
        const memory_id = memoryMatch[1];
        fetchers.push(
          () => api.fetchMemoryById(memory_id),
          () => api.fetchAccessLogs(memory_id),
          () => api.fetchRelatedMemories(memory_id),
        );
      } else if (appMatch) {
        const app_id = appMatch[1];
        fetchers.push(
          () => apps.fetchAppMemories(app_id),
          () => apps.fetchAppAccessedMemories(app_id),
          () => apps.fetchAppDetails(app_id),
        );
      } else if (pathname === "/memories") {
        fetchers.push(() => api.fetchMemories());
      } else if (pathname === "/apps") {
        fetchers.push(() => apps.fetchApps());
      } else if (pathname === "/") {
        fetchers.push(() => stats.fetchStats(), () => api.fetchMemories());
      } else if (pathname === "/settings") {
        fetchers.push(() => config.fetchConfig());
      }

      await Promise.allSettled(fetchers.map((fn) => fn()));
    } finally {
      setIsRefreshing(false);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href.substring(0, 5));
  };

  const activeClass = "bg-zinc-800 text-white border-zinc-600";
  const inactiveClass = "text-zinc-300";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="OpenMemory" width={26} height={26} />
          <span className="text-xl font-medium">OpenMemory</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-none ${
                isActive("/") ? activeClass : inactiveClass
              }`}
            >
              <HiHome />
              {t("nav.dashboard")}
            </Button>
          </Link>
          <Link href="/memories">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-none ${
                isActive("/memories") ? activeClass : inactiveClass
              }`}
            >
              <HiMiniRectangleStack />
              {t("nav.memories")}
            </Button>
          </Link>
          <Link href="/apps">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-none ${
                isActive("/apps") ? activeClass : inactiveClass
              }`}
            >
              <RiApps2AddFill />
              {t("nav.apps")}
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-none ${
                isActive("/settings") ? activeClass : inactiveClass
              }`}
            >
              <Settings />
              {t("nav.settings")}
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-zinc-700/50 bg-zinc-900 hover:bg-zinc-800"
          >
            <FiRefreshCcw className={`transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            {t("nav.refresh")}
          </Button>
          <CreateMemoryDialog />
        </div>
      </div>
    </header>
  );
}
