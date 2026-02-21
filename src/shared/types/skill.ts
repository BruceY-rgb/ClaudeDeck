export interface Skill {
  name: string
  description: string
  userInvocable?: boolean
  disableModelInvocation?: boolean
  body: string
  source: 'personal' | 'plugin'
  pluginId?: string
  filePath: string
  hasReference: boolean
  hasTemplates: boolean
}
