"use client";

import React, { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Settings,
  Menu,
} from "lucide-react";
import { HiHome, HiMiniRectangleStack } from "react-icons/hi2";
import { RiApps2AddFill } from "react-icons/ri";
import { FiRefreshCcw } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateMemoryDialog } from "@/app/memories/components/CreateMemoryDialog";
import { useLanguage } from "@/lib/LanguageContext";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useAppsApi } from "@/hooks/useAppsApi";
import { useStats } from "@/hooks/useStats";
import { useConfig } from "@/hooks/useConfig";
import { RippleButton } from "@/components/ui/ripple-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", icon: HiHome, labelKey: "nav.dashboard" },
  { href: "/memories", icon: HiMiniRectangleStack, labelKey: "nav.memories" },
  { href: "/apps", icon: RiApps2AddFill, labelKey: "nav.apps" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const memoriesApi = useMemoriesApi();
  const appsApi = useAppsApi();
  const statsApi = useStats();
  const configApi = useConfig();

  const routeBasedFetchMapping: {
    match: RegExp;
    getFetchers: (params: Record<string, string>) => (() => Promise<any>)[];
  }[] = [
    {
      match: /^\/memory\/([^/]+)$/,
      getFetchers: ({ memory_id }) => [
        () => memoriesApi.fetchMemoryById(memory_id),
        () => memoriesApi.fetchAccessLogs(memory_id),
        () => memoriesApi.fetchRelatedMemories(memory_id),
      ],
    },
    {
      match: /^\/apps\/([^/]+)$/,
      getFetchers: ({ app_id }) => [
        () => appsApi.fetchAppMemories(app_id),
        () => appsApi.fetchAppAccessedMemories(app_id),
        () => appsApi.fetchAppDetails(app_id),
      ],
    },
    {
      match: /^\/memories$/,
      getFetchers: () => [memoriesApi.fetchMemories],
    },
    {
      match: /^\/apps$/,
      getFetchers: () => [appsApi.fetchApps],
    },
    {
      match: /^\/$/,
      getFetchers: () => [statsApi.fetchStats, memoriesApi.fetchMemories],
    },
    {
      match: /^\/settings$/,
      getFetchers: () => [configApi.fetchConfig],
    },
  ];

  const getFetchersForPath = (path: string) => {
    for (const route of routeBasedFetchMapping) {
      const match = path.match(route.match);
      if (match) {
        if (route.match.source.includes("memory")) {
          return route.getFetchers({ memory_id: match[1] });
        }
        if (route.match.source.includes("app")) {
          return route.getFetchers({ app_id: match[1] });
        }
        return route.getFetchers({});
      }
    }
    return [];
  };

  const handleRefresh = async () => {
    const fetchers = getFetchersForPath(pathname);
    await Promise.allSettled(fetchers.map((fn) => fn()));
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 移动端侧边栏遮罩 */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 侧边栏 */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 68 : 220,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`
          fixed md:relative z-50 h-full flex flex-col
          border-r transition-colors duration-300
          bg-[hsl(var(--sidebar-bg))] border-[hsl(var(--sidebar-border))]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo 区域 */}
        <div className="flex items-center h-14 px-4 border-b border-[hsl(var(--sidebar-border))]">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src="/logo.svg" alt="OpenMemory" width={26} height={26} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-lg font-medium whitespace-nowrap overflow-hidden text-[hsl(var(--sidebar-text))]"
                >
                  OpenMemory
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* 导航项 */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} onClick={() => setMobileOpen(false)}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer
                          ${active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))]"
                          }
                          ${collapsed ? "justify-center" : ""}
                        `}
                      >
                        <Icon className={`shrink-0 ${active ? "text-primary" : ""}`} size={18} />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              className="text-sm font-medium whitespace-nowrap overflow-hidden"
                            >
                              {t(item.labelKey)}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="ml-2">
                      {t(item.labelKey)}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* 底部操作区 */}
        <div className="p-2 border-t border-[hsl(var(--sidebar-border))] space-y-1">
          {/* 主题切换 */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleTheme}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
                    text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))]
                    transition-colors duration-200
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <AnimatePresence mode="wait">
                    {theme === "dark" ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun size={18} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm whitespace-nowrap overflow-hidden"
                      >
                        {theme === "dark" ? t("theme.light") : t("theme.dark")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="ml-2">
                  {theme === "dark" ? t("theme.light") : t("theme.dark")}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* 折叠按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCollapsed(!collapsed)}
            className={`
              hidden md:flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
              text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))]
              transition-colors duration-200
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm whitespace-nowrap overflow-hidden"
                >
                  {t("sidebar.collapse")}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
          <div className="flex items-center gap-2">
            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <RippleButton
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-border"
            >
              <FiRefreshCcw className="transition-transform duration-300 group-hover:rotate-180" />
              {t("nav.refresh")}
            </RippleButton>
            <CreateMemoryDialog />
          </div>
        </header>

        {/* 页面内容 */}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-full"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </ScrollArea>
      </div>
    </div>
  );
}
