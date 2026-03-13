import Categories from "@/components/shared/categories";
import { Memory } from "@/components/types";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { formatDate } from "@/lib/helpers";
import { useLanguage } from "@/lib/LanguageContext";
import { RootState } from "@/store/store";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
interface RelatedMemoriesProps {
  memoryId: string;
}

export function RelatedMemories({ memoryId }: RelatedMemoriesProps) {
  const { fetchRelatedMemories } = useMemoriesApi();
  const relatedMemories = useSelector(
    (state: RootState) => state.memories.relatedMemories
  );
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loadRelatedMemories = async () => {
      try {
        await fetchRelatedMemories(memoryId);
      } catch (error) {
        console.error("Failed to fetch related memories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRelatedMemories();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-zinc-900 text-white p-6">
        <p className="text-center text-zinc-500">{t("memoryDetail.loadingRelated")}</p>
      </div>
    );
  }

  if (!relatedMemories.length) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-zinc-900 text-white p-6">
        <p className="text-center text-zinc-500">{t("memoryDetail.noRelatedMemories")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 text-white">
      <div className="px-6 py-4 flex justify-between items-center bg-zinc-800 border-b border-zinc-800">
        <h2 className="font-semibold">{t("memoryDetail.relatedMemories")}</h2>
      </div>
      <div className="space-y-6 p-6">
        {relatedMemories.map((memory: Memory) => (
          <div
            key={memory.id}
            className="border-l-2 border-zinc-800 pl-6 py-1 hover:bg-zinc-700/10 transition-colors cursor-pointer"
          >
            <Link href={`/memory/${memory.id}`}>
              <h3 className="font-medium mb-3">{memory.memory}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Categories
                    categories={memory.categories}
                    isPaused={
                      memory.state === "paused" || memory.state === "archived"
                    }
                    concat={true}
                  />
                  {memory.state !== "active" && (
                    <span className="inline-block px-3 border border-yellow-600 text-yellow-600 font-semibold text-xs rounded-full bg-yellow-400/10 backdrop-blur-sm">
                      {memory.state === "paused" ? t("state.paused") : t("state.archived")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-zinc-400 text-sm">
                    {formatDate(memory.created_at)}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
