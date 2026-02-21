import { PageHeader } from '../components/shared/PageHeader'
import { HookList } from '../components/hooks/HookList'
import { useTranslation } from '../i18n/LanguageContext'

export function HooksPage(): JSX.Element {
  const { t } = useTranslation()

  return (
    <div>
      <PageHeader
        title={t('hooks.title')}
        description={t('hooks.description')}
      />
      <HookList />
    </div>
  )
}
