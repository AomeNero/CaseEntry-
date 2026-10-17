import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * 基础 UI 组件，样式遵循 DESIGN.md（Seline）：
 * 按钮一律药丸形（rounded-full），青色实心是页面唯一 chromatic 元素；
 * 卡片纯白 + 10px 圆角 + 1px 石色细边框（无阴影，阴影留给预览卡）；
 * 单色纪律见 docs/adr/0006。
 */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  // 青色实心：视口内至多一个的主行动；墨黑字（DESIGN.md，对比度 7.45:1）
  primary: "border border-cyan-edge bg-cyan-signal text-ink-black hover:bg-cyan-edge",
  // 幽灵描边：次级动作
  secondary: "border border-stone-border text-ink-black hover:border-stone-muted",
  // 墨黑描边：审核「驳回」等与主行动并置的强次级动作（ADR-0006）
  outline: "border border-ink-black text-ink-black hover:bg-soot hover:text-white",
  // 无边框文字按钮
  ghost: "text-warm-gray hover:text-ink-black",
  // 墨黑实心：破坏性操作（不用红，配 ConfirmButton 二次确认，ADR-0006）
  destructive: "bg-ink-black text-white hover:bg-soot",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
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
    <div className={`rounded-cards border border-stone-border bg-pure-white p-6 ${className}`}>
      {children}
    </div>
  );
}

/** 细线分隔列表容器（无内边距，列表行由调用方渲染） */
export function ListCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`divide-y divide-stone-border rounded-cards border border-stone-border bg-pure-white ${className}`}
    >
      {children}
    </div>
  );
}

const FIELD_CLASS =
  "w-full rounded-inputs border border-stone-muted bg-pure-white px-3 text-base text-ink-black placeholder:text-ash-gray focus:outline-none focus:ring-2 focus:ring-cyan-signal";

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
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-black">
      {children}
    </label>
  );
}

/** 表单顶部错误提示条（单色纪律：不用红，墨黑加粗承担警示，见 ADR-0006） */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-inputs border border-stone-muted bg-stone-canvas px-3 py-2.5 text-sm font-medium text-ink-black">
      {message}
    </div>
  );
}

/** 页面区块标题：32px Inter Tight 400（whisper 字重，靠尺寸而非字重建层级） */
export function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-heading-sm font-normal text-ink-black">{title}</h1>
      {desc && <p className="mt-1 text-sm text-warm-gray">{desc}</p>}
    </div>
  );
}

/** 空状态 */
export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-cards border border-dashed border-stone-muted px-6 py-12 text-center text-sm text-warm-gray">
      {text}
    </div>
  );
}
