export interface Skill {
  name: string
  description: string
  icon?: string
  category?: string
  userInvocable?: boolean
  disableModelInvocation?: boolean
  body: string
  source: 'personal' | 'plugin'
  pluginId?: string
  filePath: string
  hasReference: boolean
  hasTemplates: boolean
}
