"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useLanguage } from "@/lib/LanguageContext";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { GoPlus } from "react-icons/go";
import { toast } from "sonner";

export function CreateMemoryDialog() {
  const { createMemory, isLoading } = useMemoriesApi();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleCreateMemory = async (text: string) => {
    if (!text.trim()) {
      toast.error(t("createMemory.emptyError") || "请输入记忆内容");
      return;
    }
    try {
      await createMemory(text);
      toast.success(t("createMemory.successToast") || "记忆创建成功");
      // 清空输入框
      if (textRef.current) {
        textRef.current.value = "";
      }
      // 关闭对话框（createMemory 内部已经通过 Redux triggerRefresh 通知列表刷新）
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t("createMemory.errorToast") || "记忆创建失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <GoPlus />
          {t("nav.createMemory")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-popover border-border">
        <DialogHeader>
          <DialogTitle>{t("createMemory.title")}</DialogTitle>
          <DialogDescription>
            {t("createMemory.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="memory">{t("createMemory.label")}</Label>
            <Textarea
              ref={textRef}
              id="memory"
              placeholder={t("createMemory.placeholder")}
              className="bg-background border-border min-h-[150px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("createMemory.cancel")}
          </Button>
          <Button
            disabled={isLoading}
            onClick={() => handleCreateMemory(textRef?.current?.value || "")}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              t("createMemory.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
