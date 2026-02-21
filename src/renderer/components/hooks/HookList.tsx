import { useEffect } from 'react'
import { useHookStore } from '../../stores/hookStore'
import { useTranslation } from '../../i18n/LanguageContext'
import type { HookEvent, HookDefinition } from '@shared/types/hook'
import { HOOK_EVENTS } from '@shared/types/hook'

const EVENT_COLORS: Record<HookEvent, string> = {
  SessionStart: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  PreToolUse: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  PostToolUse: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  PreCompact: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  Stop: 'bg-red-500/20 text-red-600 dark:text-red-400',
  SessionEnd: 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
}

export function HookList(): JSX.Element {
  const { t } = useTranslation()
  const { items, loading, error, fetch } = useHookStore()

  useEffect(() => {
    fetch()
  }, [fetch])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <p className="text-lg mb-2">{t('hooks.noHooks')}</p>
        <p className="text-sm">{t('hooks.noHooksHint')}</p>
      </div>
    )
  }

  // Group hooks by event type
  const groupedHooks = HOOK_EVENTS.reduce((acc, event) => {
    acc[event] = items.filter(h => h.event === event)
    return acc
  }, {} as Record<HookEvent, HookDefinition[]>)

  return (
    <div className="space-y-8">
      {HOOK_EVENTS.map(event => {
        const eventHooks = groupedHooks[event]
        if (eventHooks.length === 0) return null

        return (
          <div key={event}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${EVENT_COLORS[event]}`}>
                {event}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                {eventHooks.length === 1 ? t('hooks.hookCount', { count: '1' }) : t('hooks.hookCountPlural', { count: String(eventHooks.length) })}
              </span>
            </div>

            <div className="space-y-3">
              {eventHooks.map((hook, idx) => (
                <HookCard key={`${hook.pluginId}-${hook.event}-${idx}`} hook={hook} index={idx} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface HookCardProps {
  hook: HookDefinition
  index: number
}

function HookCard({ hook, index }: HookCardProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{hook.pluginName}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-sm text-zinc-500">{hook.pluginId}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {hook.matchers.map((matcher, mIdx) => (
          <div key={mIdx} className="bg-zinc-50 dark:bg-zinc-950 rounded p-3">
            <div className="text-xs text-zinc-500 mb-1">{t('hooks.matcher')}</div>
            <code className="text-sm font-mono text-blue-600 dark:text-blue-400">{matcher.matcher || '(all)'}</code>

            <div className="mt-2 space-y-1">
              {matcher.hooks.map((h, hIdx) => (
                <div key={hIdx} className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">→</span>
                  <code className="font-mono text-emerald-600 dark:text-emerald-400">{h.command}</code>
                  {h.async && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded">async</span>
                  )}
                  {h.timeout && (
                    <span className="text-zinc-400 text-xs">timeout: {h.timeout}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
