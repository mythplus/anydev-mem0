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
import { useState, useCallback, memo } from "react";
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

  const { deleteMemories, updateMemoryState, archiveMemories } = useMemoriesApi();

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteMemory, setPendingDeleteMemory] = useState<{ id: string; content: string } | null>(null);
  // 操作中的记忆 ID 集合（用于对单条记忆显示操作状态而非整个表格闪烁）
  const [operatingIds, setOperatingIds] = useState<Set<string>>(new Set());

  const handleDeleteMemory = useCallback((id: string, content: string) => {
    setPendingDeleteMemory({ id, content });
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteMemory) {
      setOperatingIds(prev => new Set(prev).add(pendingDeleteMemory.id));
      deleteMemories([pendingDeleteMemory.id]).finally(() => {
        setOperatingIds(prev => {
          const next = new Set(prev);
          next.delete(pendingDeleteMemory.id);
          return next;
        });
      });
    }
    setDeleteDialogOpen(false);
    setPendingDeleteMemory(null);
  }, [pendingDeleteMemory, deleteMemories]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setPendingDeleteMemory(null);
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      dispatch(selectAllMemories());
    } else {
      dispatch(clearSelection());
    }
  }, [dispatch]);

  const handleSelectMemory = useCallback((id: string, checked: boolean) => {
    if (checked) {
      dispatch(selectMemory(id));
    } else {
      dispatch(deselectMemory(id));
    }
  }, [dispatch]);

  const { handleOpenUpdateMemoryDialog } = useUI();

  const handleEditMemory = useCallback((memory_id: string, memory_content: string) => {
    handleOpenUpdateMemoryDialog(memory_id, memory_content);
  }, [handleOpenUpdateMemoryDialog]);

  const handleArchiveMemory = useCallback(async (id: string) => {
    setOperatingIds(prev => new Set(prev).add(id));
    try {
      await archiveMemories([id]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive memory",
        variant: "destructive",
      });
    } finally {
      setOperatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [archiveMemories, toast]);

  const handleUnarchiveMemory = useCallback(async (id: string) => {
    setOperatingIds(prev => new Set(prev).add(id));
    try {
      await updateMemoryState([id], "active");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unarchive memory",
        variant: "destructive",
      });
    } finally {
      setOperatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [updateMemoryState, toast]);

  const isAllSelected =
    memories.length > 0 && selectedMemoryIds.length === memories.length;
  const isPartiallySelected =
    selectedMemoryIds.length > 0 && selectedMemoryIds.length < memories.length;

  const handleMemoryClick = useCallback((id: string) => {
    router.push(`/memory/${id}`);
  }, [router]);

  // 操作菜单（桌面端表格行 & 移动端卡片共用）
  const ActionsMenu = ({ memory }: { memory: typeof memories[0] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 transition-all duration-200 hover:bg-zinc-800 hover:scale-110 active:scale-95 rounded-full">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-zinc-900 border-zinc-800"
      >
        <DropdownMenuItem
          className="cursor-pointer transition-colors duration-150 hover:bg-zinc-800"
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
          className="cursor-pointer transition-colors duration-150 hover:bg-zinc-800"
          onClick={() => handleEditMemory(memory.id, memory.memory)}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t("table.edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-500 focus:text-red-500 transition-colors duration-150 hover:bg-red-500/10"
          onClick={() => handleDeleteMemory(memory.id, memory.memory)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("table.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
    {/* ========== 移动端卡片视图 (< md) ========== */}
    <div className="md:hidden space-y-3">
      {/* 全选栏 */}
      <div className="flex items-center gap-3 px-1">
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
        <span className="text-xs text-zinc-400">
          {isAllSelected ? t("memories.clearSelection") : t("filter.selectAll")}
        </span>
      </div>

      {memories.map((memory, index) => (
        <div
          key={memory.id}
          className={`rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2.5 table-row-animate ${
            memory.state === "archived" ? "opacity-70" : ""
          } ${operatingIds.has(memory.id) ? "animate-pulse opacity-50" : ""}`}
          style={{ animationDelay: `${index * 0.03}s` }}
        >
          {/* 卡片顶部：复选框 + 操作菜单 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <Checkbox
                className="data-[state=checked]:border-primary border-zinc-500/50 mt-0.5 shrink-0"
                checked={selectedMemoryIds.includes(memory.id)}
                onCheckedChange={(checked) =>
                  handleSelectMemory(memory.id, checked as boolean)
                }
              />
              <div
                onClick={() => handleMemoryClick(memory.id)}
                className={`text-sm leading-relaxed break-all line-clamp-3 cursor-pointer transition-colors duration-200 ${
                  memory.state === "archived"
                    ? "text-zinc-400 hover:text-zinc-300"
                    : "text-white font-medium hover:text-primary/90"
                }`}
              >
                {memory.memory}
              </div>
            </div>
            <ActionsMenu memory={memory} />
          </div>

          {/* 卡片底部：元信息 */}
          <div className="flex items-center gap-2 flex-wrap pl-7">
            <Categories
              categories={memory.categories}
              isPaused={memory.state === "archived"}
              concat={true}
            />
            <span className="text-zinc-600">·</span>
            <SourceApp source={memory.app_name} />
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">
              {formatDate(memory.created_at, locale)}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* ========== 桌面端表格视图 (>= md) ========== */}
    <div className="hidden md:block rounded-md border border-zinc-800 overflow-x-auto scrollbar-thin">
      <Table className="min-w-[700px] table-fixed">
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
            <TableHead className="border-zinc-700" style={{ width: '40%' }}>
              <div className="flex items-center">
                <HiMiniRectangleStack className="mr-1 shrink-0" />
                {t("table.memory")}
              </div>
            </TableHead>
            <TableHead className="border-zinc-700" style={{ width: '15%' }}>
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
          {memories.map((memory, index) => (
            <TableRow
              key={memory.id}
              className={`table-row-animate table-row-hover ${
                memory.state === "archived"
                  ? "text-zinc-400"
                  : ""
              } ${operatingIds.has(memory.id) ? "animate-pulse opacity-50" : ""}`}
              style={{ animationDelay: `${index * 0.03}s` }}
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
              <TableCell className="align-top py-3">
                <div className="max-h-[80px] overflow-y-auto break-all whitespace-pre-wrap pr-2 scrollbar-thin">
                  {memory.state === "archived" ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => handleMemoryClick(memory.id)}
                            className="font-medium text-zinc-400 cursor-pointer transition-colors duration-200 hover:text-zinc-300 leading-relaxed"
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
                      className="font-medium text-white cursor-pointer transition-colors duration-200 hover:text-primary/90 leading-relaxed"
                    >
                      {memory.memory}
                    </div>
                  )}
                </div>
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
                <ActionsMenu memory={memory} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* 删除确认对话框 */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 max-w-[calc(100vw-2rem)] sm:max-w-lg">
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
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
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
