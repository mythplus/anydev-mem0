import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

interface MemoryPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

export function MemoryPagination({
  currentPage,
  totalPages,
  setCurrentPage,
}: MemoryPaginationProps) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between my-auto">
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="pagination-btn h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-xs sm:text-sm text-zinc-400 tabular-nums min-w-[80px] sm:min-w-[100px] text-center">
          {t("pagination.page")} {currentPage} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="pagination-btn h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
