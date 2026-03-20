"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useExportsApi, ExportRecord } from "@/hooks/useExportsApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCcw,
  Plus,
  Download,
  Trash2,
  MoreHorizontal,
  Search,
  FileDown,
} from "lucide-react";
import "@/styles/animation.css";

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(isoStr: string | null, locale: string): string {
  if (!isoStr) return "-";
  try {
    const date = new Date(isoStr);
    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function StateBadge({ state }: { state: string }) {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labelMap: Record<string, string> = {
    pending: "\u7b49\u5f85\u4e2d",
    processing: "\u5904\u7406\u4e2d",
    completed: "\u5df2\u5b8c\u6210",
    failed: "\u5931\u8d25",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        colorMap[state] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
      }`}
    >
      {state === "processing" && (
        <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
      )}
      {labelMap[state] || state}
    </span>
  );
}

export default function ExportsPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const {
    fetchExports,
    createExport,
    downloadExport,
    deleteExport,
    isLoading,
  } = useExportsApi();

  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadExports = useCallback(
    async (search?: string) => {
      try {
        const data = await fetchExports(search, 1, 100);
        setExports(data.items);
        setTotal(data.total);
      } catch (err) {
        console.error("Failed to load exports:", err);
      }
    },
    [fetchExports]
  );

  useEffect(() => {
    loadExports();
  }, [loadExports]);

  const handleSearch = useCallback(() => {
    loadExports(searchQuery || undefined);
  }, [loadExports, searchQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  const handleCreateExport = useCallback(async () => {
    setIsCreating(true);
    try {
      await createExport();
      toast({ title: t("exports.createSuccess"), description: t("exports.createSuccessDesc") });
      await loadExports(searchQuery || undefined);
    } catch (err: any) {
      toast({ title: t("exports.createError"), description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  }, [createExport, loadExports, searchQuery, toast, t]);

  const handleDownload = useCallback(
    async (id: string) => {
      try {
        await downloadExport(id);
      } catch (err: any) {
        toast({ title: t("exports.downloadError"), description: err.message, variant: "destructive" });
      }
    },
    [downloadExport, toast, t]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteExport(pendingDeleteId);
      toast({ title: t("exports.deleteSuccess"), description: t("exports.deleteSuccessDesc") });
      await loadExports(searchQuery || undefined);
    } catch (err: any) {
      toast({ title: t("exports.deleteError"), description: err.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, deleteExport, loadExports, searchQuery, toast, t]);

  const handleRefresh = useCallback(() => {
    loadExports(searchQuery || undefined);
  }, [loadExports, searchQuery]);

  return (
    <div>
      <main className="flex-1 py-6">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-slide-down">
            <div>
              <h1 className="text-2xl font-bold text-white">{t("exports.title")}</h1>
              <p className="text-sm text-zinc-400 mt-1">{t("exports.description")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-1.5">
                <RefreshCcw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                {t("nav.refresh")}
              </Button>
              <Button size="sm" onClick={handleCreateExport} disabled={isCreating} className="bg-primary hover:bg-primary/90 text-white gap-1.5">
                <Plus className="size-4" />
                {isCreating ? t("exports.creating") : t("exports.create")}
              </Button>
            </div>
          </div>
          <div className="mb-4 animate-fade-slide-down delay-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("exports.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-zinc-700 bg-zinc-900/50 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="animate-fade-slide-down delay-2">
            {exports.length > 0 ? (
              <div className="rounded-md border border-zinc-800 overflow-x-auto scrollbar-thin">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-zinc-800 hover:bg-zinc-800">
                      <TableHead className="w-[80px] text-zinc-400"># ID</TableHead>
                      <TableHead className="w-[100px] text-zinc-400">{t("exports.colState")}</TableHead>
                      <TableHead className="w-[100px] text-zinc-400">{t("exports.colEntities")}</TableHead>
                      <TableHead className="w-[170px] text-zinc-400">{t("exports.colStarted")}</TableHead>
                      <TableHead className="w-[170px] text-zinc-400">{t("exports.colCompleted")}</TableHead>
                      <TableHead className="w-[80px] text-right text-zinc-400">{t("exports.colActions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exports.map((record, index) => (
                      <TableRow key={record.id} className="table-row-animate table-row-hover" style={{ animationDelay: `${index * 0.03}s` }}>
                        <TableCell className="font-mono text-xs text-zinc-400">
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">{record.id.slice(0, 8)}...</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{record.id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell><StateBadge state={record.state} /></TableCell>
                        <TableCell className="text-zinc-300">
                          {record.entity_count}
                          {record.file_size != null && (
                            <span className="text-xs text-zinc-500 ml-1">({formatFileSize(record.file_size)})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-400">{formatDateTime(record.started_at, locale)}</TableCell>
                        <TableCell className="text-sm text-zinc-400">{formatDateTime(record.completed_at, locale)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 transition-all duration-200 hover:bg-zinc-800 hover:scale-110 active:scale-95 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              {record.state === "completed" && (
                                <DropdownMenuItem className="cursor-pointer transition-colors duration-150 hover:bg-zinc-800" onClick={() => handleDownload(record.id)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  {t("exports.download")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 transition-colors duration-150 hover:bg-red-500/10" onClick={() => handleDeleteClick(record.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("exports.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-zinc-800/60 p-5 mb-5">
                  <FileDown className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-300">{t("exports.noExports")}</h3>
                <p className="text-zinc-500 mt-2 mb-5 max-w-sm">{t("exports.noExportsDesc")}</p>
                <Button size="sm" onClick={handleCreateExport} disabled={isCreating} className="bg-primary hover:bg-primary/90 text-white gap-1.5">
                  <Plus className="size-4" />
                  {t("exports.create")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t("exports.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">{t("exports.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">{t("table.deleteCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">{t("table.deleteConfirmBtn")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
