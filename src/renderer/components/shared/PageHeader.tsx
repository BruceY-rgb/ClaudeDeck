import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string | React.ReactNode
  actions?: React.ReactNode
  backTo?: { label: string; path: string }
  eyebrow?: string
  badge?: React.ReactNode
}

export function PageHeader({ title, description, actions, backTo, eyebrow, badge }: PageHeaderProps): JSX.Element {
  return (
    <div className="mb-6 rounded-[28px] border border-[var(--border-soft)] bg-[var(--panel)] px-6 py-5 shadow-[var(--panel-shadow)]">
      {backTo && (
        <Link
          to={backTo.path}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
        >
          <ArrowLeft className="w-4 h-4" />
          {backTo.label}
        </Link>
      )}
      <div className="flex items-start justify-between">
        <div>
          {eyebrow && (
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-subtle)]">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">{title}</h1>
            {badge}
          </div>
          {description && (
            typeof description === 'string'
              ? <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
              : <div className="mt-2 text-sm text-[var(--text-muted)]">{description}</div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
