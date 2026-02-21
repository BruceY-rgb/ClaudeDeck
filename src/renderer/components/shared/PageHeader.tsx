import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string | React.ReactNode
  actions?: React.ReactNode
  backTo?: { label: string; path: string }
}

export function PageHeader({ title, description, actions, backTo }: PageHeaderProps): JSX.Element {
  return (
    <div className="mb-6">
      {backTo && (
        <Link
          to={backTo.path}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {backTo.label}
        </Link>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            typeof description === 'string'
              ? <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
              : <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
