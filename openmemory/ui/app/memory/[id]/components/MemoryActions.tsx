import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useUI } from "@/hooks/useUI";
import { useLanguage } from "@/lib/LanguageContext";
import { Archive, ChevronDown, Pencil, Play } from "lucide-react";
import { useCallback, useState } from "react";

interface MemoryActionsProps {
  memoryId: string;
  memoryContent: string;
  memoryState: string;
}

export function MemoryActions({
  memoryId,
  memoryContent,
  memoryState,
}: MemoryActionsProps) {
  const { handleOpenUpdateMemoryDialog } = useUI();
  const { updateMemoryState } = useMemoriesApi();
  const { t } = useLanguage();
  const [isOperating, setIsOperating] = useState(false);

  const handleEdit = useCallback(() => {
    handleOpenUpdateMemoryDialog(memoryId, memoryContent);
  }, [memoryId, memoryContent, handleOpenUpdateMemoryDialog]);

  const handleStateChange = useCallback(async (newState: string) => {
    setIsOperating(true);
    try {
      await updateMemoryState([memoryId], newState);
    } finally {
      setIsOperating(false);
    }
  }, [memoryId, updateMemoryState]);

  const getStateLabel = () => {
    switch (memoryState) {
      case "archived":
        return t("state.archived");
      default:
        return t("state.active");
    }
  };

  const getStateIcon = () => {
    switch (memoryState) {
      case "archived":
        return <Archive className="h-3 w-3 mr-2" />;
      default:
        return <Play className="h-3 w-3 mr-2" />;
    }
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isOperating}
            variant="outline"
            size="sm"
            className="shadow-md bg-zinc-900 border border-zinc-700/50 hover:bg-zinc-950 text-zinc-400"
          >
            <span className="font-semibold">{getStateLabel()}</span>
            <ChevronDown className="h-3 w-3 mt-1 -ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40 bg-zinc-900 border-zinc-800 text-zinc-100">
          <DropdownMenuLabel>{t("memoryDetail.changeState")}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            onClick={() => handleStateChange("active")}
            className="cursor-pointer flex items-center"
            disabled={memoryState === "active"}
          >
            <Play className="h-3 w-3 mr-2" />
            <span className="font-semibold">{t("memoryDetail.active")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleStateChange("archived")}
            className="cursor-pointer flex items-center"
            disabled={memoryState === "archived"}
          >
            <Archive className="h-3 w-3 mr-2" />
            <span className="font-semibold">{t("memoryDetail.archive")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        disabled={isOperating}
        variant="outline"
        size="sm"
        onClick={handleEdit}
        className="shadow-md bg-zinc-900 border border-zinc-700/50 hover:bg-zinc-950 text-zinc-400"
      >
        <Pencil className="h-3 w-3 -mr-1" />
        <span className="font-semibold">{t("table.edit")}</span>
      </Button>
    </div>
  );
}
