import type { LucideIcon } from "lucide-react";

export function IconAvatar({
  icon: Icon,
  tone = "default",
}: {
  icon: LucideIcon;
  tone?: "default" | "brand" | "muted";
}): JSX.Element {
  const toneClass =
    tone === "brand"
      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
      : tone === "muted"
        ? "bg-[var(--panel-muted)] text-[var(--text-muted)]"
        : "bg-white/80 text-[var(--text-strong)] dark:bg-white/5";

  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}>
      <Icon className="h-4.5 w-4.5" />
    </span>
  );
}
