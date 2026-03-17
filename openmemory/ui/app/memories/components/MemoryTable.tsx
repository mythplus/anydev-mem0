import Categories from "@/components/shared/categories";
import SourceApp from "@/components/shared/source-app";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CiCalendar } from "react-icons/ci";
import { GoPackage } from "react-icons/go";
import { HiMiniRectangleStack } from "react-icons/hi2";
import { PiSwatches } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";

export function MemoryTable() {
  const { toast } = useToast();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t, locale } = useLanguage();
  const selectedMemoryIds = useSelector(
    (state: RootState) => state.memories.selectedMemoryIds
  );
  const memories = useSelector((state: RootState) => state.memories.memories);

  const { deleteMemories, updateMemoryState, archiveMemories, isLoading } = useMemoriesApi();

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteMemory, setPendingDeleteMemory] = useState<{ id: string; content: string } | null>(null);

  const handleDeleteMemory = (id: string, content: string) => {
    setPendingDeleteMemory({ id, content });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteMemory) {
      deleteMemories([pendingDeleteMemory.id]);
    }
    setDeleteDialogOpen(false);
    setPendingDeleteMemory(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteMemory(null);
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

  const handleArchiveMemory = async (id: string) => {
    try {
      await archiveMemories([id]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive memory",
        variant: "destructive",
      });
    }
  };

  const handleUnarchiveMemory = async (id: string) => {
    try {
      await updateMemoryState([id], "active");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unarchive memory",
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
    <>
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-zinc-800 hover:bg-zinc-800">
            <TableHead className="w-[50px] pl-4">
              <Checkbox
                className="data-[state=checked]:border-primary border-zinc-500/50"
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
            <TableHead className="border-zinc-700">
              <div className="flex items-center">
                <HiMiniRectangleStack className="mr-1 shrink-0" />
                {t("table.memory")}
              </div>
            </TableHead>
            <TableHead className="border-zinc-700">
              <div className="flex items-center">
                <PiSwatches className="mr-1 shrink-0" size={15} />
                {t("table.categories")}
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center">
                <GoPackage className="mr-1 shrink-0" />
                {t("table.sourceApp")}
              </div>
            </TableHead>
            <TableHead className="w-[120px] border-zinc-700 whitespace-nowrap">
              <div className="flex items-center w-full justify-center">
                <CiCalendar className="mr-1 shrink-0" size={16} />
                {t("table.createdOn")}
              </div>
            </TableHead>
            <TableHead className="w-[50px] text-right border-zinc-700">
              <div className="flex items-center justify-center">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memories.map((memory) => (
            <TableRow
              key={memory.id}
              className={`hover:bg-zinc-900/50 ${
                memory.state === "archived"
                  ? "text-zinc-400"
                  : ""
              } ${isLoading ? "animate-pulse opacity-50" : ""}`}
            >
              <TableCell className="pl-4">
                <Checkbox
                  className="data-[state=checked]:border-primary border-zinc-500/50"
                  checked={selectedMemoryIds.includes(memory.id)}
                  onCheckedChange={(checked) =>
                    handleSelectMemory(memory.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell className="">
                {memory.state === "archived" ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleMemoryClick(memory.id)}
                          className="font-medium text-zinc-400 cursor-pointer"
                        >
                          {memory.memory}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {t("table.memoryIsPaused")}
                          <span className="font-bold">
                            {t("table.archived")}
                          </span>
                          {t("table.andDisabled")}<span className="font-bold">{t("table.disabled")}</span>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div
                    onClick={() => handleMemoryClick(memory.id)}
                    className="font-medium text-white cursor-pointer"
                  >
                    {memory.memory}
                  </div>
                )}
              </TableCell>
              <TableCell className="">
                <div className="flex flex-wrap gap-1">
                  <Categories
                    categories={memory.categories}
                    isPaused={memory.state === "archived"}
                    concat={true}
                  />
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center">
                <SourceApp source={memory.app_name} />
              </TableCell>
              <TableCell className="w-[140px] text-center">
                {formatDate(memory.created_at, locale)}
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
                    className="bg-zinc-900 border-zinc-800"
                  >
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        if (memory.state !== "archived") {
                          handleArchiveMemory(memory.id);
                        } else {
                          handleUnarchiveMemory(memory.id);
                        }
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
                      onClick={() => handleDeleteMemory(memory.id, memory.memory)}
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

    {/* 删除确认对话框 */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t("table.deleteConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {t("table.deleteConfirmDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pendingDeleteMemory && (
          <div className="my-2 rounded-md bg-zinc-800 border border-zinc-700 p-3">
            <p className="text-sm text-zinc-200 break-all line-clamp-5">
              {pendingDeleteMemory.content}
            </p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={cancelDelete}
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            {t("table.deleteCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {t("table.deleteConfirmBtn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
