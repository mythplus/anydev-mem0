"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Settings, PanelLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiHome, HiMiniRectangleStack } from "react-icons/hi2";
import { RiApps2AddFill } from "react-icons/ri";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { toggleSidebar } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href.substring(0, 5));
  };

  // 导航菜单项
  const navItems = [
    {
      href: "/",
      icon: HiHome,
      label: t("nav.dashboard"),
    },
    {
      href: "/memories",
      icon: HiMiniRectangleStack,
      label: t("nav.memories"),
    },
    {
      href: "/apps",
      icon: RiApps2AddFill,
      label: t("nav.apps"),
    },
    {
      href: "/settings",
      icon: Settings,
      label: t("nav.settings"),
    },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* 侧边栏头部 - Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="OpenMemory">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/logo.svg"
                    alt="OpenMemory"
                    width={24}
                    height={24}
                    className="shrink-0"
                  />
                </div>
                <span className="text-lg font-semibold truncate">
                  OpenMemory
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* 侧边栏主内容 - 导航 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 侧边栏底部 - 收起/展开按钮 */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={t("nav.collapseSidebar")}
              className="w-full justify-start"
            >
              <PanelLeft className="size-4" />
              <span>{t("nav.collapseSidebar")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* 拖拽折叠轨道 */}
      <SidebarRail />
    </Sidebar>
  );
}
