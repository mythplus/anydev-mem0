import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/LanguageContext";
import { Archive, Play, Trash2, ArrowRight, History } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface StatusHistoryEntry {
  id: string;
  old_state: string;
  new_state: string;
  changed_by: string;
  changed_at: string;
}

interface StatusHistoryProps {
  memoryId: string;
}

const stateConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  active: { icon: <Play className="h-3 w-3" />, label: "Active", color: "text-green-400" },
  archived: { icon: <Archive className="h-3 w-3" />, label: "Archived", color: "text-yellow-400" },
  deleted: { icon: <Trash2 className="h-3 w-3" />, label: "Deleted", color: "text-red-400" },
};

export function StatusHistory({ memoryId }: StatusHistoryProps) {
  const { t } = useLanguage();
  const [histories, setHistories] = useState<StatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const URL = process.env.NEXT_PUBLIC_API_URL || "http://21.6.186.148:8765";

  useEffect(() => {
    const loadHistory = async () => {
      if (!memoryId) return;
      try {
        const response = await axios.get(
          `${URL}/api/v1/memories/${memoryId}/status-history?page=1&page_size=20`
        );
        setHistories(response.data.histories || []);
      } catch (error) {
        console.error("Failed to fetch status history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [memoryId]);

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 text-white p-6">
        <p className="text-center text-zinc-500">{t("memoryDetail.loadingStatusHistory")}</p>
      </div>
    );
  }

  const getStateInfo = (state: string) => {
    return stateConfig[state] || { icon: <History className="h-3 w-3" />, label: state, color: "text-zinc-400" };
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 text-white pb-1">
      <div className="px-6 py-4 flex justify-between items-center bg-zinc-800 border-b border-zinc-800">
        <h2 className="font-semibold">{t("memoryDetail.statusHistory")}</h2>
      </div>

      <ScrollArea className="p-6 max-h-[300px]">
        {histories.length === 0 && (
          <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden min-h-[80px] flex items-center justify-center text-white p-6">
            <p className="text-center text-zinc-500">
              {t("memoryDetail.noStatusHistory")}
            </p>
          </div>
        )}
        <ul className="space-y-6">
          {histories.map((entry, index) => {
            const oldInfo = getStateInfo(entry.old_state);
            const newInfo = getStateInfo(entry.new_state);

            return (
              <li key={entry.id} className="relative flex items-start gap-4">
                <div className="relative z-10 rounded-full overflow-hidden bg-zinc-800 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <History className="h-4 w-4 text-zinc-400" />
                </div>

                {index < histories.length - 1 && (
                  <div className="absolute left-4 top-6 bottom-0 w-[1px] h-[calc(100%+0.5rem)] bg-zinc-700 transform -translate-x-1/2"></div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`flex items-center gap-1 ${oldInfo.color}`}>
                      {oldInfo.icon}
                      {oldInfo.label}
                    </span>
                    <ArrowRight className="h-3 w-3 text-zinc-500" />
                    <span className={`flex items-center gap-1 font-medium ${newInfo.color}`}>
                      {newInfo.icon}
                      {newInfo.label}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-xs">
                    {entry.changed_at
                      ? new Date(entry.changed_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })
                      : "Unknown"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
