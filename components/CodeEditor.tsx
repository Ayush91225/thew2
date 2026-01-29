'use client'

import { useEffect, useRef, useMemo, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import { useIDEStore } from '@/stores/ide-store-fast'
import { useHotkeys } from 'react-hotkeys-hook'

// Dynamic import for Monaco to reduce initial bundle
const Editor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-zinc-400">
      Loading editor...
    </div>
  )
})

// Simplified editor options for faster loading
const EDITOR_OPTIONS = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  tabSize: 2,
  automaticLayout: true,
  quickSuggestions: false,
  parameterHints: { enabled: false },
  folding: false,
  lineNumbers: 'on',
  renderWhitespace: 'none'
}

const CodeEditor = memo(() => {
  const { tabs, activeTab, updateTabContent } = useIDEStore()
  const editorRef = useRef<any>(null)
  
  const currentTab = useMemo(() => 
    tabs.find(tab => tab.id === activeTab), 
    [tabs, activeTab]
  )

  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor
  }, [])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (currentTab && value !== undefined) {
      updateTabContent(currentTab.id, value)
    }
  }, [currentTab, updateTabContent])

  // Keyboard shortcuts
  useHotkeys('meta+s', (e) => {
    e.preventDefault()
    if (currentTab) {
      useIDEStore.getState().saveFile(currentTab.id)
    }
  })

  if (!currentTab) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <div className="text-lg font-semibold mb-2">No file open</div>
          <div className="text-sm">Open a file to start coding</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="h-9 px-4 flex items-center bg-zinc-950/80 border-b border-zinc-800/50 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <i className="ph ph-folder-simple text-zinc-500"></i>
          <span className="text-zinc-200 font-medium">{currentTab.name}</span>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={currentTab.language}
          value={currentTab.content}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={EDITOR_OPTIONS}
        />
      </div>
    </div>
  )
})

CodeEditor.displayName = 'CodeEditor'

export default CodeEditor