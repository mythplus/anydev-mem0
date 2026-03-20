"use client";

import { Install } from "@/components/dashboard/Install";
import Stats from "@/components/dashboard/Stats";
import { MemoryFilters } from "@/app/memories/components/MemoryFilters";
import { MemoriesSection } from "@/app/memories/components/MemoriesSection";
import "@/styles/animation.css";

export default function DashboardPage() {
  return (
    <div className="text-white py-4 sm:py-6">
      <div className="container px-3 sm:px-6 lg:px-8">
        <div className="w-full mx-auto space-y-4 sm:space-y-6">
          {/* 响应式网格：移动端单列，lg 以上恢复 3 列 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Memory Category Breakdown */}
            <div className="lg:col-span-2 animate-fade-slide-down">
              <Install />
            </div>

            {/* Memories Stats */}
            <div className="lg:col-span-1 animate-fade-slide-down delay-1">
              <Stats />
            </div>
          </div>

          <div>
            <div className="animate-fade-slide-down delay-2">
              <MemoryFilters />
            </div>
            <div className="animate-fade-slide-down delay-3">
              <MemoriesSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
