import { useEffect } from 'react'
import { useToast } from '../components/shared/Toast'

export function useFileWatcher(onChanged: () => void): void {
  const { showToast } = useToast()

  useEffect(() => {
    const unsubscribe = window.electronAPI.onFileChanged((event) => {
      // Show toast notification
      const fileName = event.path.split('/').pop() || event.path
      let message = ''
      switch (event.type) {
        case 'add':
          message = `File added: ${fileName}`
          break
        case 'change':
          message = `File changed: ${fileName}`
          break
        case 'unlink':
          message = `File removed: ${fileName}`
          break
        default:
          message = `File ${event.type}: ${fileName}`
      }
      showToast(message, 'info')

      // Call the refresh callback
      onChanged()
    })
    return unsubscribe
  }, [onChanged, showToast])
}
