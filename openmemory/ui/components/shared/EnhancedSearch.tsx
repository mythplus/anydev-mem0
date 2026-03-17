"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/LanguageContext";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { useRouter, useSearchParams } from "next/navigation";

const RECENT_SEARCHES_KEY = "openmemory-recent-searches";
const MAX_RECENT = 5;
const MAX_SUGGESTIONS = 8;

/**
 * 增强搜索组件 - 支持实时联想和最近搜索历史
 */
export function EnhancedSearch() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { id: string; text: string; category: string }[]
  >([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const memories = useSelector((state: RootState) => state.memories.memories);

  // 初始化：加载最近搜索和 URL 参数
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }

    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setQuery(urlSearch);
    }
  }, []);

  // 实时联想：根据输入从本地记忆列表中模糊匹配
  const updateSuggestions = useCallback(
    debounce((q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      const lower = q.toLowerCase();
      const matched = memories
        .filter((m) => m.memory.toLowerCase().includes(lower))
        .slice(0, MAX_SUGGESTIONS)
        .map((m) => ({
          id: m.id,
          text: m.memory,
          category:
            m.categories && m.categories.length > 0
              ? (m.categories[0] as string)
              : "",
        }));
      setSuggestions(matched);
    }, 150),
    [memories]
  );

  useEffect(() => {
    updateSuggestions(query);
  }, [query, updateSuggestions]);

  // 保存最近搜索
  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(
      0,
      MAX_RECENT
    );
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // 执行搜索
  const executeSearch = (q: string) => {
    saveRecentSearch(q);
    setIsOpen(false);
    router.push(`/memories?search=${encodeURIComponent(q)}`);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 文本高亮：将匹配部分用 mark 标签包裹
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const truncated = text.length > 80 ? text.substring(0, 80) + "..." : text;
    const idx = truncated.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return truncated;
    return (
      <>
        {truncated.substring(0, idx)}
        <mark className="bg-primary/30 text-primary rounded-sm px-0.5">
          {truncated.substring(idx, idx + q.length)}
        </mark>
        {truncated.substring(idx + q.length)}
      </>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      executeSearch(query);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showDropdown =
    isOpen && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div className="relative flex-1 max-w-[500px]">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <Input
        ref={inputRef}
        placeholder={t("memories.searchPlaceholder")}
        className="pl-8 pr-8 bg-background border-border"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            setSuggestions([]);
            router.push("/memories");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {/* 搜索联想 */}
            {suggestions.length > 0 && (
              <div className="p-1">
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                  {t("search.suggestions")}
                </div>
                {suggestions.map((s) => (
                  <motion.button
                    key={s.id}
                    whileHover={{ backgroundColor: "hsl(var(--accent))" }}
                    onClick={() => executeSearch(s.text.substring(0, 50))}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md text-sm"
                  >
                    <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                    <span className="truncate text-popover-foreground">
                      {highlightMatch(s.text, query)}
                    </span>
                    {s.category && (
                      <span className="ml-auto text-xs text-muted-foreground capitalize shrink-0">
                        {s.category}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* 最近搜索 */}
            {!query && recentSearches.length > 0 && (
              <div className="p-1 border-t border-border">
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                  {t("search.recentSearches")}
                </div>
                {recentSearches.map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ backgroundColor: "hsl(var(--accent))" }}
                    onClick={() => {
                      setQuery(s);
                      executeSearch(s);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md text-sm text-popover-foreground"
                  >
                    <Clock size={12} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{s}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
