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
import { Archive, ChevronDown, Pause, Pencil, Play } from "lucide-react";

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
  const { updateMemoryState, isLoading } = useMemoriesApi();
  const { t } = useLanguage();

  const handleEdit = () => {
    handleOpenUpdateMemoryDialog(memoryId, memoryContent);
  };

  const handleStateChange = (newState: string) => {
    updateMemoryState([memoryId], newState);
  };

  const getStateLabel = () => {
    switch (memoryState) {
      case "archived":
        return t("state.archived");
      case "paused":
        return t("state.paused");
      default:
        return t("state.active");
    }
  };

  const getStateIcon = () => {
    switch (memoryState) {
      case "archived":
        return <Archive className="h-3 w-3 mr-2" />;
      case "paused":
        return <Pause className="h-3 w-3 mr-2" />;
      default:
        return <Play className="h-3 w-3 mr-2" />;
    }
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="shadow-md bg-card border border-border hover:bg-accent text-muted-foreground"
          >
            <span className="font-semibold">{getStateLabel()}</span>
            <ChevronDown className="h-3 w-3 mt-1 -ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40 bg-popover border-border text-popover-foreground">
          <DropdownMenuLabel>{t("memoryDetail.changeState")}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem
            onClick={() => handleStateChange("active")}
            className="cursor-pointer flex items-center"
            disabled={memoryState === "active"}
          >
            <Play className="h-3 w-3 mr-2" />
            <span className="font-semibold">{t("memoryDetail.active")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleStateChange("paused")}
            className="cursor-pointer flex items-center"
            disabled={memoryState === "paused"}
          >
            <Pause className="h-3 w-3 mr-2" />
            <span className="font-semibold">{t("memoryDetail.pause")}</span>
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
        disabled={isLoading}
        variant="outline"
        size="sm"
        onClick={handleEdit}
            className="shadow-md bg-card border border-border hover:bg-accent text-muted-foreground"
      >
        <Pencil className="h-3 w-3 -mr-1" />
        <span className="font-semibold">{t("table.edit")}</span>
      </Button>
    </div>
  );
}
