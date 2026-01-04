'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
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
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false)

  const currentTab = tabs.find(tab => tab.id === activeTab)

  const handleContentChange = useCallback((content: string) => {
    if (activeTab && content !== currentTab?.content) {
      updateTabContent(activeTab, content)
    }
  }, [activeTab, currentTab?.content, updateTabContent])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined
    
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (activeTab && editorRef.current) {
          const content = editorRef.current.getValue()
          updateTabContent(activeTab, content)
          saveFile(activeTab)
          console.log('File saved:', currentTab?.name)
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    const loadMonaco = async () => {
      if (typeof window === 'undefined') return
      
      // Check if Monaco is already loaded
      if ((window as any).monaco) {
        setIsMonacoLoaded(true)
        if (currentTab) {
          createEditor((window as any).monaco, currentTab)
        }
        return
      }

      try {
        // Load Monaco from CDN with better error handling
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js'
        script.onload = () => {
          const require = (window as any).require
          require.config({ 
            paths: { 'vs': 'https://unpkg.com/monaco-editor@0.44.0/min/vs' },
            'vs/nls': { availableLanguages: { '*': 'en' } }
          })
          
          require(['vs/editor/editor.main'], () => {
            const monaco = (window as any).monaco
            monacoRef.current = monaco
            setIsMonacoLoaded(true)
            
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
        script.onerror = () => {
          console.error('Failed to load Monaco Editor')
          setIsMonacoLoaded(false)
        }
        document.head.appendChild(script)
      } catch (error) {
        console.error('Error loading Monaco:', error)
        setIsMonacoLoaded(false)
      }
    }

    const createEditor = (monaco: any, tab: any) => {
      const container = document.getElementById('editor-container')
      if (!container) {
        console.error('Editor container not found')
        return
      }

      if (editorRef.current) {
        editorRef.current.dispose()
      }

      try {
        const editor = monaco.editor.create(container, {
          value: tab.content,
          language: tab.language,
          theme: 'kriya-dark',
          fontSize: fontSize,
          tabSize: tabSize,
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
          renderWhitespace: 'selection',
          renderControlCharacters: true,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true,
        })

        // Enable content change tracking
        editor.onDidChangeModelContent(() => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            const content = editor.getValue()
            handleContentChange(content)
          }, 300)
        })

        editorRef.current = editor
        console.log('Monaco editor created successfully')
      } catch (error) {
        console.error('Error creating Monaco editor:', error)
      }
    }

    loadMonaco()
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('keydown', handleKeyDown)
      if (editorRef.current) {
        editorRef.current.dispose()
      }
    }
  }, [])

  // Update editor when tab changes
  useEffect(() => {
    if (editorRef.current && currentTab && monacoRef.current && isMonacoLoaded) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== currentTab.content) {
        editorRef.current.setValue(currentTab.content)
        const model = editorRef.current.getModel()
        if (model) {
          monacoRef.current.editor.setModelLanguage(model, currentTab.language)
        }
      }
    } else if (isMonacoLoaded && currentTab && monacoRef.current) {
      // Create editor if it doesn't exist but Monaco is loaded
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
          fontSize: fontSize,
          tabSize: tabSize,
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
          renderWhitespace: 'selection',
          renderControlCharacters: true,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true,
        })

        editor.onDidChangeModelContent(() => {
          const content = editor.getValue()
          handleContentChange(content)
        })

        editorRef.current = editor
      }
      createEditor(monacoRef.current, currentTab)
    }
  }, [activeTab, currentTab, isMonacoLoaded, fontSize, tabSize, minimap])

  // Update minimap setting
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ minimap: { enabled: minimap } })
    }
  }, [minimap])

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
      <div id="editor-container" className="flex-1 bg-black relative">
        {!isMonacoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-zinc-400 text-sm">
              <i className="ph ph-spinner animate-spin mr-2"></i>
              Loading Monaco Editor...
            </div>
          </div>
        )}
        {isMonacoLoaded && !currentTab && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <i className="ph ph-file-text text-4xl mb-4 block"></i>
              <div className="text-lg font-medium mb-2">No file open</div>
              <div className="text-sm">Open a file from the sidebar to start editing</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 border-t-line px-4 flex items-center justify-between text-[10px] mono bg-black shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <i className="ph ph-git-branch"></i>
            <span>main</span>
          </div>
          <div className="flex items-center gap-1">
            <i className={`ph ${isMonacoLoaded ? 'ph-check-circle text-green-400' : 'ph-spinner animate-spin text-yellow-400'}`}></i>
            <span>{isMonacoLoaded ? 'Ready' : 'Loading...'}</span>
          </div>
          {minimap && (
            <div className="flex items-center gap-1">
              <i className="ph ph-map text-blue-400"></i>
              <span>Minimap</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>⌘S Save • ⌘K Commands • ⌃` Terminal • ⌘⇧F Search</span>
        </div>
      </div>
    </main>
  )
}