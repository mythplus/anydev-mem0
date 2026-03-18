import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="flex items-center justify-between my-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-zinc-400 tabular-nums min-w-[100px] text-center">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
