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
  // 用于标记当前请求是否已被用户取消
  const cancelledRef = useRef(false);

  // 统一的关闭/取消处理
  const handleCancel = () => {
    // 标记为已取消，让进行中的请求回调忽略结果
    cancelledRef.current = true;
    // 清空输入框
    if (textRef.current) {
      textRef.current.value = "";
    }
    setOpen(false);
  };

  const handleCreateMemory = async (text: string) => {
    if (!text.trim()) {
      toast.error(t("createMemory.emptyError") || "请输入记忆内容");
      return;
    }
    // 重置取消标记
    cancelledRef.current = false;
    try {
      await createMemory(text);
      // 如果在请求过程中用户点了取消，则不显示成功提示
      if (cancelledRef.current) {
        return;
      }
      toast.success(t("createMemory.successToast") || "记忆创建成功");
      // 清空输入框
      if (textRef.current) {
        textRef.current.value = "";
      }
      // 关闭对话框（createMemory 内部已经通过 Redux triggerRefresh 通知列表刷新）
      setOpen(false);
    } catch (error) {
      // 如果已取消则忽略错误
      if (cancelledRef.current) {
        return;
      }
      console.error(error);
      toast.error(t("createMemory.errorToast") || "记忆创建失败");
    }
  };

  // 处理对话框打开/关闭状态变化（包括 ESC 键、点击遮罩层、点击 X 按钮）
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // 关闭时执行取消逻辑
      handleCancel();
    } else {
      // 打开时重置取消标记
      cancelledRef.current = false;
      setOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
      <DialogContent className="sm:max-w-[525px] bg-zinc-900 border-zinc-800 shadow-2xl shadow-black/30">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("createMemory.title")}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t("createMemory.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="memory" className="text-sm font-medium">{t("createMemory.label")}</Label>
            <Textarea
              ref={textRef}
              id="memory"
              placeholder={t("createMemory.placeholder")}
              className="bg-zinc-950 border-zinc-800 min-h-[150px] focus:border-primary/40 transition-all duration-200 resize-none scrollbar-thin"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="btn-press transition-all duration-200"
          >
            {t("createMemory.cancel")}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={() => handleCreateMemory(textRef?.current?.value || "")}
            className="btn-press transition-all duration-200"
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
