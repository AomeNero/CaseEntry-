import { GRADE_LABELS, STATUS_LABELS, type CaseStatus, type Grade } from "@/lib/case-state";

/**
 * 状态徽章：单色纪律（ADR-0006）——不新增色相，过程态用青调（描边/天青底）、
 * 入库用墨黑实心、驳回用灰阶描边；靠填充/描边/深浅组合区分。
 */
const STATUS_STYLES: Record<CaseStatus, string> = {
  PENDING_FIRST: "border border-cyan-edge text-cyan-edge",
  PENDING_FINAL: "bg-sky-wash text-ink-black",
  PUBLISHED: "bg-ink-black text-white",
  REJECTED: "border border-stone-muted text-warm-gray",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** 等级徽章：A 墨黑实心 / B 暖灰实心 / C 灰阶描边 */
const GRADE_STYLES: Record<Grade, string> = {
  A: "bg-ink-black text-white",
  B: "bg-warm-gray text-white",
  C: "border border-ash-gray text-warm-gray",
};

export function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${GRADE_STYLES[grade]}`}
    >
      {GRADE_LABELS[grade]}
    </span>
  );
}
