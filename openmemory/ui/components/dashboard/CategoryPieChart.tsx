"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useLanguage } from "@/lib/LanguageContext";
import { useMemo } from "react";

// 分类颜色映射（与 categories.tsx 组件保持一致的色系）
const CATEGORY_COLORS: Record<string, string> = {
  personal: "#8B5CF6",
  work: "#3B82F6",
  health: "#10B981",
  finance: "#F59E0B",
  travel: "#EC4899",
  education: "#6366F1",
  preferences: "#14B8A6",
  relationships: "#F97316",
};

const DEFAULT_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#EF4444",
  "#06B6D4",
];

/**
 * 分类分布饼图 - 展示各分类下记忆的数量占比
 */
export function CategoryPieChart() {
  const { t } = useLanguage();
  const memories = useSelector((state: RootState) => state.memories.memories);

  const pieData = useMemo(() => {
    const categoryCount: Record<string, number> = {};

    memories.forEach((m) => {
      if (m.categories && m.categories.length > 0) {
        m.categories.forEach((cat: string) => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      } else {
        categoryCount["uncategorized"] = (categoryCount["uncategorized"] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color:
          CATEGORY_COLORS[name.toLowerCase()] ||
          DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [memories]);

  const hasData = pieData.length > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        {t("chart.categoryDistribution")}
      </h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
          {t("chart.noData")}
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                animationDuration={800}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5 max-h-[180px] overflow-y-auto">
            {pieData.slice(0, 8).map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-muted-foreground truncate flex-1">
                  {item.name}
                </span>
                <span className="text-card-foreground font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
