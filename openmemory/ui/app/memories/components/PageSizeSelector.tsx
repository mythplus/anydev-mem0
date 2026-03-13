import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/LanguageContext";

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
}: PageSizeSelectorProps) {
  const pageSizeOptions = [10, 20, 50, 100];
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500">{t("memories.show")}</span>
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger className="w-[70px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-zinc-500">{t("memories.items")}</span>
    </div>
  );
}

export default PageSizeSelector;
