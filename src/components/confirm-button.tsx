"use client";

import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui";

/** 破坏性操作提交按钮：墨黑实心 + 原生 confirm 二次确认（ADR-0006，红色警示由确认交互替代） */
export function ConfirmButton({
  message,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "variant"> & { message: string }) {
  return (
    <Button
      type="submit"
      variant="destructive"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    />
  );
}
