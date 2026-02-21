import { useState } from 'react'

export function useAppPreferences() {
  const [editorFontSize, setEditorFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem('editorFontSize')
    return saved ? Number(saved) : 14
  })

  const setEditorFontSize = (size: number) => {
    const clamped = Math.min(24, Math.max(10, size))
    setEditorFontSizeState(clamped)
    localStorage.setItem('editorFontSize', String(clamped))
  }

  return { editorFontSize, setEditorFontSize }
}
