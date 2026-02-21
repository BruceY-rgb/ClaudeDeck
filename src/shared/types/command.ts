export interface Command {
  name: string
  description: string
  disableModelInvocation?: boolean
  body: string
  pluginId: string
  pluginName: string
  filePath: string
}
