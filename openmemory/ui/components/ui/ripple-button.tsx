"use client";

import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

/**
 * 带有水波纹 (Ripple) 点击效果的按钮组件
 * 在按钮被点击时，会在点击位置产生一个扩散的波纹动效
 */
const RippleButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        button.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      }

      onClick?.(e);
    };

    return (
      <Button
        ref={(node) => {
          buttonRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("ripple-container", className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

RippleButton.displayName = "RippleButton";

export { RippleButton };
