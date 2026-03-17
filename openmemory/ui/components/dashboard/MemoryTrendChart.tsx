"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useLanguage } from "@/lib/LanguageContext";
import { useMemo } from "react";

/**
 * 记忆趋势图 - 展示最近7天每天创建的记忆数量趋势
 * 数据基于 Redux store 中现有的记忆列表
 */
export function MemoryTrendChart() {
  const { t } = useLanguage();
  const memories = useSelector((state: RootState) => state.memories.memories);

  const chartData = useMemo(() => {
    const now = new Date();
    const days: { date: string; count: number; label: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = `${d.getMonth() + 1}/${d.getDate()}`;

      const count = memories.filter((m) => {
        const created = new Date(m.created_at);
        return created.toISOString().split("T")[0] === dateStr;
      }).length;

      days.push({ date: dateStr, count, label });
    }

    return days;
  }, [memories]);

  const hasData = chartData.some((d) => d.count > 0);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        {t("chart.memoryTrend")}
      </h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
          {t("chart.noData")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(260, 94%, 59%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(260, 94%, 59%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(260, 94%, 59%)"
              strokeWidth={2}
              fill="url(#colorCount)"
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
