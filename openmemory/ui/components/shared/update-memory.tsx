"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";

interface UpdateMemoryProps {
  memoryId: string;
  memoryContent: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpdateMemory = ({
  memoryId,
  memoryContent,
  open,
  onOpenChange,
}: UpdateMemoryProps) => {
  const { updateMemory, isLoading, fetchMemories, fetchMemoryById } =
    useMemoriesApi();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleUpdateMemory = async (text: string) => {
    try {
      await updateMemory(memoryId, text);
      toast.success("Memory updated successfully");
      onOpenChange(false);
      if (pathname.includes("memories")) {
        await fetchMemories();
      } else {
        await fetchMemoryById(memoryId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update memory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-zinc-900 border-zinc-800 z-50 shadow-2xl shadow-black/30">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("updateMemory.title")}</DialogTitle>
          <DialogDescription className="text-zinc-400">{t("updateMemory.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="memory" className="text-sm font-medium">{t("updateMemory.label")}</Label>
            <Textarea
              ref={textRef}
              id="memory"
              className="bg-zinc-950 border-zinc-800 min-h-[150px] focus:border-primary/40 transition-all duration-200 resize-none scrollbar-thin"
              defaultValue={memoryContent}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="btn-press transition-all duration-200">
            {t("updateMemory.cancel")}
          </Button>
          <Button
            className="w-[140px] btn-press transition-all duration-200"
            disabled={isLoading}
            onClick={() => handleUpdateMemory(textRef?.current?.value || "")}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              t("updateMemory.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateMemory;
