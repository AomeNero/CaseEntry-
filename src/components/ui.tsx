import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * 基础 UI 组件，样式遵循 DESIGN.md：
 * 按钮一律 rounded-md（8px 矩形，非药丸），卡片 rounded-lg（12px）+ hairline 边框。
 */

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost" | "on-dark" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-pressed",
  secondary: "border border-hairline-strong text-ink hover:bg-surface",
  dark: "bg-ink-deep text-white hover:bg-charcoal",
  ghost: "text-ink hover:bg-surface",
  "on-dark": "bg-white text-ink hover:bg-surface-soft",
  danger: "border border-error text-error hover:bg-tint-rose",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-[18px] py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:bg-hairline disabled:text-muted ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-hairline bg-canvas p-6 ${className}`}>
      {children}
    </div>
  );
}

const FIELD_CLASS =
  "w-full rounded-md border border-hairline-strong bg-canvas px-3 text-base text-ink placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-primary";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_CLASS} h-11 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD_CLASS} h-11 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_CLASS} min-h-24 py-2.5 ${className}`} {...props} />;
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-charcoal">
      {children}
    </label>
  );
}

/** 表单顶部错误提示条 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-error/30 bg-tint-rose px-3 py-2.5 text-sm text-error">
      {message}
    </div>
  );
}

/** 页面区块标题 */
export function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {desc && <p className="mt-1 text-sm text-slate">{desc}</p>}
    </div>
  );
}

/** 空状态 */
export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-12 text-center text-sm text-steel">
      {text}
    </div>
  );
}
