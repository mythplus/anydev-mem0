"use client";

import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useLanguage } from "@/lib/LanguageContext";
import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { useTheme } from "next-themes";

// react-force-graph-2d 需要 window/Canvas 对象，使用动态导入禁用 SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  group: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

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

const DEFAULT_COLOR = "#6366F1";

/**
 * 知识图谱可视化 - 使用 react-force-graph 展示记忆之间的关联
 * 每个记忆是一个节点，相同分类的记忆之间有连线
 */
export function KnowledgeGraph() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const memories = useSelector((state: RootState) => state.memories.memories);
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  // 响应容器尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 600,
          height: 350,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const graphData: GraphData = useMemo(() => {
    if (memories.length === 0) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const categoryMemories: Record<string, string[]> = {};

    // 建立节点和分类索引
    memories.slice(0, 50).forEach((m) => {
      const mainCat =
        m.categories && m.categories.length > 0
          ? (m.categories[0] as string)
          : "uncategorized";

      nodes.push({
        id: m.id,
        name:
          m.memory.length > 40 ? m.memory.substring(0, 40) + "..." : m.memory,
        val: 3,
        color: CATEGORY_COLORS[mainCat] || DEFAULT_COLOR,
        group: mainCat,
      });

      // 将记忆 ID 按分类归类
      if (!categoryMemories[mainCat]) categoryMemories[mainCat] = [];
      categoryMemories[mainCat].push(m.id);
    });

    // 为相同分类的记忆之间创建连线（限制连线数量以避免过度密集）
    Object.values(categoryMemories).forEach((ids) => {
      for (let i = 0; i < ids.length && i < 8; i++) {
        for (let j = i + 1; j < ids.length && j < 8; j++) {
          links.push({
            source: ids[i],
            target: ids[j],
            value: 1,
          });
        }
      }
    });

    return { nodes, links };
  }, [memories]);

  const hasData = graphData.nodes.length > 0;

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = Math.max(10 / globalScale, 2);

      // 绘制节点圆点
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // 仅在放大到一定程度时显示标签
      if (globalScale > 1.5) {
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = theme === "dark" ? "#e4e4e7" : "#27272a";
        ctx.fillText(label, node.x, node.y + node.val + fontSize + 1);
      }
    },
    [theme]
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4" ref={containerRef}>
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        {t("graph.title")}
      </h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
          {t("graph.noData")}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ height: 350 }}>
          <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={dimensions.width - 32}
              height={350}
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
              }}
              linkColor={() => theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
              linkWidth={0.5}
              backgroundColor="transparent"
              cooldownTicks={100}
              d3VelocityDecay={0.3}
              enableZoomInteraction={true}
              enablePanInteraction={true}
            />
        </div>
      )}

      {/* 分类图例 */}
      {hasData && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
          {Object.entries(
            graphData.nodes.reduce<Record<string, number>>((acc, n) => {
              acc[n.group] = (acc[n.group] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .map(([group, count]) => (
              <div key={group} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: CATEGORY_COLORS[group] || DEFAULT_COLOR,
                  }}
                />
                <span className="text-muted-foreground capitalize">
                  {group} ({count})
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
