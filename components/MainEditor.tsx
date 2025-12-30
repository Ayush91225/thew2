'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useIDEStore } from '@/stores/ide-store'

export default function MainEditor() {
  const { 
    tabs, 
    activeTab, 
    setActiveTab, 
    closeTab, 
    updateTabContent,
    fontSize,
    tabSize,
    minimap,
    saveFile
  } = useIDEStore()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  const currentTab = tabs.find(tab => tab.id === activeTab)

  const handleContentChange = useCallback((content: string) => {
    if (activeTab && content !== currentTab?.content) {
      updateTabContent(activeTab, content)
    }
  }, [activeTab, currentTab?.content, updateTabContent])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (activeTab) {
          saveFile(activeTab)
          console.log('File saved:', currentTab?.name)
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    const initEditor = () => {
      if (typeof window !== 'undefined' && (window as any).require) {
        (window as any).require.config({ 
          paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } 
        })
        
        ;(window as any).require(['vs/editor/editor.main'], () => {
          const monaco = (window as any).monaco
          monacoRef.current = monaco
          
          // Define custom theme
          monaco.editor.defineTheme('kriya-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6A737D' },
              { token: 'keyword', foreground: 'F97583' },
              { token: 'string', foreground: '9ECBFF' },
              { token: 'number', foreground: '79B8FF' },
              { token: 'type', foreground: 'B392F0' },
              { token: 'function', foreground: 'B392F0' },
              { token: 'variable', foreground: 'E1E4E8' },
            ],
            colors: {
              'editor.background': '#000000',
              'editor.foreground': '#E1E4E8',
              'editor.lineHighlightBackground': '#0A0A0A',
              'editor.selectionBackground': '#264F78',
              'editorCursor.foreground': '#FFFFFF',
              'editorLineNumber.foreground': '#6A737D',
              'editorGutter.background': '#000000',
            }
          })

          if (currentTab) {
            createEditor(monaco, currentTab)
          }
        })
      }
    }

    const createEditor = (monaco: any, tab: any) => {
      const container = document.getElementById('editor-container')
      if (!container) return

      if (editorRef.current) {
        editorRef.current.dispose()
      }

      const editor = monaco.editor.create(container, {
        value: tab.content,
        language: tab.language,
        theme: 'kriya-dark',
        fontSize,
        tabSize,
        minimap: { enabled: minimap },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        automaticLayout: true,
        wordWrap: 'on',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false,
        },
      })

      // Debounced content change
      editor.onDidChangeModelContent(() => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          const content = editor.getValue()
          handleContentChange(content)
        }, 300)
      })

      editorRef.current = editor
    }

    setTimeout(initEditor, 500)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('keydown', handleKeyDown)
      if (editorRef.current) {
        editorRef.current.dispose()
      }
    }
  }, [currentTab?.id, fontSize, tabSize, minimap, activeTab, currentTab, handleContentChange, saveFile])

  // Update editor content when tab changes
  useEffect(() => {
    if (editorRef.current && currentTab && monacoRef.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== currentTab.content) {
        editorRef.current.setValue(currentTab.content)
      }
    }
  }, [activeTab, currentTab])

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-black">
      {/* Editor Tabs */}
      <div className="h-10 border-b-line flex items-center shrink-0">
        <div className="flex gap-1 px-4 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700">
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold cursor-pointer transition whitespace-nowrap shrink-0 ${
                activeTab === tab.id ? 'tab-active' : 'text-zinc-600 hover:text-white'
              }`}
            >
              <i className={`${tab.icon} text-sm`}></i>
              <span>{tab.name}</span>
              {tab.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
              <i 
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }} 
                className="ph ph-x text-[10px] hover:text-white ml-1"
              ></i>
            </div>
          ))}
        </div>
        <div className="ml-auto px-4">
          <div className="text-[10px] text-zinc-600 mono">
            {currentTab ? `${currentTab.language} • ${currentTab.name}` : 'No file open'}
          </div>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div id="editor-container" className="flex-1 bg-black"></div>

      {/* Status Bar */}
      <div className="h-6 border-t-line px-4 flex items-center justify-between text-[10px] mono bg-black shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <i className="ph ph-git-branch"></i>
            <span>main</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="ph ph-check-circle text-green-400"></i>
            <span>Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>⌘S Save • ⌘K Commands • ⌃` Terminal • ⌘⇧F Search</span>
        </div>
      </div>
    </main>
  )
}