export function SectionPanel({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--panel)] p-5 shadow-[var(--panel-shadow)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-strong)]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
