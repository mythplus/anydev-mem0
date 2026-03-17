
import Categories from "@/components/shared/categories";
import SourceApp from "@/components/shared/source-app";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useUI } from "@/hooks/useUI";
import { formatDate } from "@/lib/helpers";
import { useLanguage } from "@/lib/LanguageContext";
import {
    clearSelection,
    deselectMemory,
    selectAllMemories,
    selectMemory,
} from "@/store/memoriesSlice";
import { RootState } from "@/store/store";
import {
    Archive,
    Edit,
    MoreHorizontal,
    Pause,
    Play,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CiCalendar } from "react-icons/ci";
import { GoPackage } from "react-icons/go";
import { HiMiniRectangleStack } from "react-icons/hi2";
import { PiSwatches } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";

export function MemoryTable() {
  const { toast } = useToast();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const selectedMemoryIds = useSelector(
    (state: RootState) => state.memories.selectedMemoryIds
  );
  const memories = useSelector((state: RootState) => state.memories.memories);

  const { deleteMemories, updateMemoryState, isLoading } = useMemoriesApi();

  const handleDeleteMemory = (id: string) => {
    deleteMemories([id]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      dispatch(selectAllMemories());
    } else {
      dispatch(clearSelection());
    }
  };

  const handleSelectMemory = (id: string, checked: boolean) => {
    if (checked) {
      dispatch(selectMemory(id));
    } else {
      dispatch(deselectMemory(id));
    }
  };
  const { handleOpenUpdateMemoryDialog } = useUI();

  const handleEditMemory = (memory_id: string, memory_content: string) => {
    handleOpenUpdateMemoryDialog(memory_id, memory_content);
  };

  const handleUpdateMemoryState = async (id: string, newState: string) => {
    try {
      await updateMemoryState([id], newState);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update memory state",
        variant: "destructive",
      });
    }
  };

  const isAllSelected =
    memories.length > 0 && selectedMemoryIds.length === memories.length;
  const isPartiallySelected =
    selectedMemoryIds.length > 0 && selectedMemoryIds.length < memories.length;

  const handleMemoryClick = (id: string) => {
    router.push(`/memory/${id}`);
  };

  return (
    <div className="rounded-md border">
      <Table className="">
        <TableHeader>
          <TableRow className="bg-secondary hover:bg-secondary">
            <TableHead className="w-[50px] pl-4">
              <Checkbox
                className="data-[state=checked]:border-primary border-muted-foreground/30"
                checked={isAllSelected}
                data-state={
                  isPartiallySelected
                    ? "indeterminate"
                    : isAllSelected
                    ? "checked"
                    : "unchecked"
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="border-border">
              <div className="flex items-center min-w-[600px]">
                <HiMiniRectangleStack className="mr-1" />
                {t("table.memory")}
              </div>
            </TableHead>
            <TableHead className="border-border">
              <div className="flex items-center">
                <PiSwatches className="mr-1" size={15} />
                {t("table.categories")}
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-border">
              <div className="flex items-center">
                <GoPackage className="mr-1" />
                {t("table.sourceApp")}
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-border">
              <div className="flex items-center w-full justify-center">
                <CiCalendar className="mr-1" size={16} />
                {t("table.createdOn")}
              </div>
            </TableHead>
            <TableHead className="text-right border-border flex justify-center">
              <div className="flex items-center justify-end">
                <MoreHorizontal className="h-4 w-4 mr-2" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memories.map((memory, index) => (
            <TableRow
              key={memory.id}
              style={{ animationDelay: `${index * 30}ms` }}
              className={`animate-fade-in hover:bg-accent/50 ${
                memory.state === "paused" || memory.state === "archived"
                  ? "text-muted-foreground"
                  : ""
              } ${isLoading ? "animate-pulse opacity-50" : ""}`}
            >
              <TableCell className="pl-4">
                <Checkbox
                  className="data-[state=checked]:border-primary border-muted-foreground/30"
                  checked={selectedMemoryIds.includes(memory.id)}
                  onCheckedChange={(checked) =>
                    handleSelectMemory(memory.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell className="">
                {memory.state === "paused" || memory.state === "archived" ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleMemoryClick(memory.id)}
                          className={`font-medium ${
                            memory.state === "paused" ||
                            memory.state === "archived"
                              ? "text-muted-foreground"
                              : "text-foreground"
                          } cursor-pointer`}
                        >
                          {memory.memory}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {t("table.memoryIsPaused")}
                          <span className="font-bold">
                            {memory.state === "paused" ? t("table.paused") : t("table.archived")}
                          </span>
                          {t("table.andDisabled")}<span className="font-bold">{t("table.disabled")}</span>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div
                    onClick={() => handleMemoryClick(memory.id)}
                    className={`font-medium text-foreground cursor-pointer`}
                  >
                    {memory.memory}
                  </div>
                )}
              </TableCell>
              <TableCell className="">
                <div className="flex flex-wrap gap-1">
                  <Categories
                    categories={memory.categories}
                    isPaused={
                      memory.state === "paused" || memory.state === "archived"
                    }
                    concat={true}
                  />
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center">
                <SourceApp source={memory.app_name} />
              </TableCell>
              <TableCell className="w-[140px] text-center">
                {formatDate(memory.created_at)}
              </TableCell>
              <TableCell className="text-right flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-popover border-border"
                  >
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        const newState =
                          memory.state === "active" ? "paused" : "active";
                        handleUpdateMemoryState(memory.id, newState);
                      }}
                    >
                      {memory?.state === "active" ? (
                        <>
                      <Pause className="mr-2 h-4 w-4" />
                          {t("table.pause")}
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          {t("table.resume")}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        const newState =
                          memory.state === "active" ? "archived" : "active";
                        handleUpdateMemoryState(memory.id, newState);
                      }}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {memory?.state !== "archived" ? (
                        <>{t("table.archive")}</>
                      ) : (
                        <>{t("table.unarchive")}</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => handleEditMemory(memory.id, memory.memory)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t("table.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 focus:text-red-500"
                      onClick={() => handleDeleteMemory(memory.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("table.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
