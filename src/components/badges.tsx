import { GRADE_LABELS, STATUS_LABELS, type CaseStatus, type Grade } from "@/lib/case-state";

/** 状态徽章：粉彩 chip，rounded-sm（DESIGN.md badge-tag 规格） */
const STATUS_STYLES: Record<CaseStatus, string> = {
  PENDING_FIRST: "bg-tint-yellow text-charcoal",
  PENDING_FINAL: "bg-tint-sky text-navy-mid",
  PUBLISHED: "bg-tint-mint text-brand-green",
  REJECTED: "bg-tint-rose text-error",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** 等级徽章：A 紫 / B 蓝 / C 绿 */
const GRADE_STYLES: Record<Grade, string> = {
  A: "bg-tint-lavender text-primary-deep",
  B: "bg-tint-sky text-navy-mid",
  C: "bg-tint-mint text-brand-green",
};

export function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-semibold ${GRADE_STYLES[grade]}`}
    >
      {GRADE_LABELS[grade]}
    </span>
  );
}
