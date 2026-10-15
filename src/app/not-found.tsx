import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-stone-canvas px-6 text-center">
      <p className="font-display text-caption font-normal uppercase tracking-[0.3em] text-ash-gray">
        404
      </p>
      <h1 className="font-display text-display font-normal text-ink-black">
        这一页
        <span className="rounded bg-sky-wash px-2 text-cyan-edge">走丢了</span>
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-warm-gray">
        你要访问的页面不存在，或已随案例状态变化而移动。
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center justify-center rounded-full border border-cyan-edge bg-cyan-signal px-4 text-sm font-medium text-white transition-colors hover:bg-cyan-edge"
      >
        回首页
      </Link>
    </main>
  );
}
