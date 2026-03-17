"use client";

import { Install } from "@/components/dashboard/Install";
import Stats from "@/components/dashboard/Stats";
import { MemoryTrendChart } from "@/components/dashboard/MemoryTrendChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { KnowledgeGraph } from "@/components/dashboard/KnowledgeGraph";
import { MemoryFilters } from "@/app/memories/components/MemoryFilters";
import { MemoriesSection } from "@/app/memories/components/MemoriesSection";
import "@/styles/animation.css";

export default function DashboardPage() {
  return (
    <div className="text-foreground py-6">
      <div className="container">
        <div className="w-full mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* MCP 安装指引 */}
            <div className="col-span-2 animate-fade-slide-down">
              <Install />
            </div>

            {/* 统计面板 */}
            <div className="col-span-1 animate-fade-slide-down delay-1">
              <Stats />
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="animate-fade-slide-down delay-2">
              <MemoryTrendChart />
            </div>
            <div className="animate-fade-slide-down delay-2">
              <CategoryPieChart />
            </div>
          </div>

          {/* 知识图谱 */}
          <div className="animate-fade-slide-down delay-3">
            <KnowledgeGraph />
          </div>

          {/* 记忆列表 */}
          <div>
            <div className="animate-fade-slide-down delay-4">
              <MemoryFilters />
            </div>
            <div className="animate-fade-slide-down delay-5">
              <MemoriesSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
