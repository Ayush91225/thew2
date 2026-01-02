'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useIDEStore } from '@/stores/ide-store'
import { useHotkeys } from 'react-hotkeys-hook'
import { collaborationService, TextOperation } from '@/lib/collaboration-service'

// Extract editor options to prevent recreation on every render
const EDITOR_OPTIONS = {
  theme: 'kriya-dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
  fontLigatures: true,
  lineHeight: 1.6,
  letterSpacing: 0.5,
  minimap: { 
    enabled: true,
    side: 'right' as const,
    showSlider: 'always' as const,
    renderCharacters: true,
    maxColumn: 200,
    scale: 2,
    size: 'proportional' as const
  },
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  wordWrapColumn: 120,
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  smoothScrolling: true,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
  cursorWidth: 2,
  renderWhitespace: 'selection' as const,
  renderControlCharacters: true,
  renderLineHighlight: 'all' as const,
  renderLineHighlightOnlyWhenFocus: false,
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    bracketPairsHorizontal: true,
    highlightActiveBracketPair: true,
    indentation: true,
    highlightActiveIndentation: true
  },
  folding: true,
  foldingStrategy: 'indentation' as const,
  foldingHighlight: true,
  showFoldingControls: 'always' as const,
  unfoldOnClickAfterEndOfLine: true,
  foldingImportsByDefault: false,
  contextmenu: true,
  quickSuggestions: {
    other: true,
    comments: true,
    strings: true
  },
  quickSuggestionsDelay: 100,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on' as const,
  acceptSuggestionOnCommitCharacter: true,
  tabCompletion: 'on' as const,
  wordBasedSuggestions: 'matchingDocuments' as const,
  parameterHints: { 
    enabled: true,
    cycle: true
  },
  autoClosingBrackets: 'always' as const,
  autoClosingQuotes: 'always' as const,
  autoClosingDelete: 'always' as const,
  autoSurround: 'languageDefined' as const,
  autoIndent: 'full' as const,
  formatOnPaste: true,
  formatOnType: true,
  dragAndDrop: true,
  copyWithSyntaxHighlighting: true,
  multiCursorModifier: 'ctrlCmd' as const,
  multiCursorMergeOverlapping: true,
  accessibilitySupport: 'auto' as const,
  find: {
    seedSearchStringFromSelection: 'always' as const,
    autoFindInSelection: 'never' as const,
    addExtraSpaceOnTop: true
  },
  gotoLocation: {
    multipleTypeDefinitions: 'peek' as const,
    multipleDeclarations: 'peek' as const,
    multipleImplementations: 'peek' as const,
    multipleReferences: 'peek' as const
  },
  hover: {
    enabled: true,
    delay: 300,
    sticky: true
  },
  colorDecorators: true,
  definitionLinkOpensInPeek: false,
  detectIndentation: true,
  emptySelectionClipboard: true,
  fastScrollSensitivity: 5,
  fixedOverflowWidgets: false,
  glyphMargin: true,
  hideCursorInOverviewRuler: false,
  highlightActiveIndentGuide: false,
  links: true,
  matchBrackets: 'always' as const,
  mouseWheelScrollSensitivity: 1,
  mouseWheelZoom: true,
  occurrencesHighlight: 'singleFile' as const,
  overviewRulerBorder: true,
  overviewRulerLanes: 3,
  readOnly: false,
  renameOnType: false,
  rulers: [80, 120] as number[],
  scrollbar: {
    vertical: 'auto' as const,
    horizontal: 'auto' as const,
    arrowSize: 11,
    useShadows: true,
    verticalHasArrows: false,
    horizontalHasArrows: false,
    verticalScrollbarSize: 14,
    horizontalScrollbarSize: 12,
    verticalSliderSize: 14,
    horizontalSliderSize: 12
  },
  selectionClipboard: true,
  selectionHighlight: true,
  showUnused: false,
  snippetSuggestions: 'top' as const,
  stickyScroll: {
    enabled: true,
    maxLineCount: 5
  },
  suggest: {
    filterGraceful: true,
    insertMode: 'insert' as const,
    localityBonus: true,
    shareSuggestSelections: true,
    showIcons: true,
    showStatusBar: true,
    snippetsPreventQuickSuggestions: false
  },
  useTabStops: true,
  wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
  wrappingIndent: 'indent' as const,
  wrappingStrategy: 'advanced' as const
} as const

export default function CodeEditor() {
  const { tabs, activeTab, updateTabContent, collab } = useIDEStore()
  const editorRef = useRef<any>(null)
  const currentTabRef = useRef<string | null>(null)
  const collaborationCursors = useRef<Map<string, any>>(new Map())

  const currentTab = useMemo(() => tabs.find(tab => tab.id === activeTab), [tabs, activeTab])

  const monacoInitialized = useRef(false)

  // Collaboration helper functions
  const applyRemoteOperation = useCallback((operation: TextOperation) => {
    if (!editorRef.current) {
      console.warn('Editor not available for remote operation')
      return
    }
    
    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) {
      console.warn('Editor model not available')
      return
    }

    try {
      console.log('🔄 Applying remote operation:', operation)
      
      // Set flag to prevent sending this change back
      if (editor._setApplyingRemoteOperation) {
        editor._setApplyingRemoteOperation(true)
      }
      
      // Apply the operation based on type
      if (operation.type === 'insert' && operation.content) {
        const position = model.getPositionAt(operation.position)
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }
        const editOperation = { range, text: operation.content }
        model.pushEditOperations([], [editOperation], () => null)
        console.log('✅ Insert operation applied successfully')
      } else if (operation.type === 'delete' && operation.length) {
        const startPos = model.getPositionAt(operation.position)
        const endPos = model.getPositionAt(operation.position + operation.length)
        const range = {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column
        }
        const editOperation = { range, text: '' }
        model.pushEditOperations([], [editOperation], () => null)
        console.log('✅ Delete operation applied successfully')
      }
      
      // Update the tab content immediately after applying remote operation
      const currentActiveTab = useIDEStore.getState().activeTab
      const currentTabs = useIDEStore.getState().tabs
      const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
      
      if (activeTabData) {
        const newContent = model.getValue()
        useIDEStore.getState().updateTabContent(activeTabData.id, newContent)
        console.log('🔄 Tab content updated after remote operation')
      }
      
      // Reset flag after a short delay to ensure the change event is processed
      setTimeout(() => {
        if (editor._setApplyingRemoteOperation) {
          editor._setApplyingRemoteOperation(false)
        }
      }, 100) // Increased delay to ensure proper synchronization
    } catch (error) {
      console.error('❌ Error applying remote operation:', error)
      // Reset flag on error
      if (editor._setApplyingRemoteOperation) {
        editor._setApplyingRemoteOperation(false)
      }
    }
  }, [])

  const updateRemoteCursor = useCallback((userId: string, cursor: { line: number; column: number }) => {
    if (!editorRef.current) return
    
    const editor = editorRef.current
    const existingDecoration = collaborationCursors.current.get(userId)
    
    if (existingDecoration) {
      editor.removeDecorations([existingDecoration])
    }

    const decorations = editor.createDecorationsCollection([
      {
        range: {
          startLineNumber: cursor.line,
          startColumn: cursor.column,
          endLineNumber: cursor.line,
          endColumn: cursor.column
        },
        options: {
          className: `collaboration-cursor-${userId}`,
          hoverMessage: { value: `User ${userId}` }
        }
      }
    ])
    
    collaborationCursors.current.set(userId, decorations)
  }, [])

  useEffect(() => {
    if (!monacoInitialized.current && typeof window !== 'undefined') {
      monacoInitialized.current = true
      import('@monaco-editor/react').then(({ loader }) => {
        loader.init().then((monaco) => {
          monaco.editor.defineTheme('kriya-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
              { token: 'keyword', foreground: 'F97583', fontStyle: 'bold' },
              { token: 'string', foreground: '9ECBFF' },
              { token: 'number', foreground: '79B8FF' },
              { token: 'type', foreground: 'B392F0' },
              { token: 'class', foreground: 'FFAB70' },
              { token: 'function', foreground: 'B392F0' },
              { token: 'variable', foreground: 'E1E4E8' },
              { token: 'constant', foreground: '79B8FF' },
              { token: 'operator', foreground: 'F97583' },
              { token: 'delimiter', foreground: 'E1E4E8' },
              { token: 'tag', foreground: '85E89D' },
              { token: 'attribute.name', foreground: 'FFAB70' },
              { token: 'attribute.value', foreground: '9ECBFF' },
            ],
            colors: {
              'editor.background': '#000000',
              'editor.foreground': '#E1E4E8',
              'editor.lineHighlightBackground': '#0A0A0A',
              'editor.selectionBackground': '#264F78',
              'editor.inactiveSelectionBackground': '#3A3D41',
              'editorCursor.foreground': '#FFFFFF',
              'editorWhitespace.foreground': '#3B4048',
              'editorIndentGuide.background': '#3B4048',
              'editorIndentGuide.activeBackground': '#6A737D',
              'editorLineNumber.foreground': '#6A737D',
              'editorLineNumber.activeForeground': '#E1E4E8',
              'editorGutter.background': '#000000',
              'editorGutter.modifiedBackground': '#E2C08D',
              'editorGutter.addedBackground': '#28A745',
              'editorGutter.deletedBackground': '#D73A49',
              'editorError.foreground': '#F85149',
              'editorWarning.foreground': '#F0883E',
              'editorInfo.foreground': '#58A6FF',
              'editorHint.foreground': '#7C3AED',
              'editorWidget.background': '#161B22',
              'editorWidget.border': '#30363D',
              'editorSuggestWidget.background': '#161B22',
              'editorSuggestWidget.border': '#30363D',
              'editorSuggestWidget.foreground': '#E1E4E8',
              'editorSuggestWidget.selectedBackground': '#264F78',
              'editorHoverWidget.background': '#161B22',
              'editorHoverWidget.border': '#30363D',
              'peekView.border': '#30363D',
              'peekViewEditor.background': '#0D1117',
              'peekViewResult.background': '#161B22',
              'peekViewTitle.background': '#21262D',
              'minimap.background': '#1E1E1E',
              'minimap.foregroundOpacity': '#D4D4D4',
              'minimap.findMatchHighlight': '#FFD700',
              'minimap.selectionHighlight': '#264F78',
              'minimap.errorHighlight': '#F85149',
              'minimap.warningHighlight': '#F0883E',
              'minimapSlider.background': '#79797933',
              'minimapSlider.hoverBackground': '#79797966',
              'minimapSlider.activeBackground': '#797979cc',
            }
          })

          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
          })
        })
      })
    }
  }, [])

  // Collaboration setup - initialize when collab mode changes
  useEffect(() => {
    if (!editorRef.current || !activeTab) return

    if (collab) {
      console.log('🔗 Setting up collaboration for tab:', activeTab)
      
      // Set up real-time collaboration event listeners
      const handleOperation = (data: any) => {
        console.log('📝 Remote operation received:', data)
        // Handle different data formats from the backend
        if (data && typeof data === 'object') {
          // Direct operation object
          if (data.type && (data.type === 'insert' || data.type === 'delete')) {
            applyRemoteOperation(data)
          }
          // Nested operation
          else if (data.operation) {
            applyRemoteOperation(data.operation)
          }
          // Legacy format
          else if (data.data && data.data.operation) {
            applyRemoteOperation(data.data.operation)
          }
          else {
            console.warn('⚠️ Invalid operation format:', data)
          }
        } else {
          console.warn('⚠️ Invalid operation data:', data)
        }
      }

      const handleCursorUpdate = (data: any) => {
        console.log('👆 Remote cursor update:', data)
        if (data && data.userId && data.cursor) {
          updateRemoteCursor(data.userId, data.cursor)
        } else {
          console.warn('⚠️ Invalid cursor update format:', data)
        }
      }

      const handleOperationConfirmed = (data: any) => {
        console.log('✅ Operation confirmed by server:', data)
      }

      // Add event listeners
      collaborationService.on('operation', handleOperation)
      collaborationService.on('cursor-update', handleCursorUpdate)
      collaborationService.on('operation-confirmed', handleOperationConfirmed)

      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up collaboration event listeners')
        collaborationService.off('operation', handleOperation)
        collaborationService.off('cursor-update', handleCursorUpdate)
        collaborationService.off('operation-confirmed', handleOperationConfirmed)
      }
    }
  }, [collab, activeTab, applyRemoteOperation, updateRemoteCursor])

  // Handle tab switching
  useEffect(() => {
    if (editorRef.current && currentTab && currentTabRef.current !== currentTab.id) {
      editorRef.current.setValue(currentTab.content)
      currentTabRef.current = currentTab.id
    }
  }, [currentTab?.id, currentTab])

  // Enhanced hotkeys
  useHotkeys('meta+s', (e) => {
    e.preventDefault()
    if (currentTab && editorRef.current) {
      const content = editorRef.current.getValue()
      updateTabContent(currentTab.id, content)
    }
  })

  useHotkeys('meta+z', (e) => {
    e.preventDefault()
    editorRef.current?.trigger('keyboard', 'undo', null)
  })

  useHotkeys('meta+shift+z', (e) => {
    e.preventDefault()
    editorRef.current?.trigger('keyboard', 'redo', null)
  })

  useHotkeys('meta+f', (e) => {
    e.preventDefault()
    editorRef.current?.getAction('actions.find')?.run()
  })

  useHotkeys('meta+h', (e) => {
    e.preventDefault()
    editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run()
  })

  useHotkeys('meta+shift+f', (e) => {
    e.preventDefault()
    editorRef.current?.getAction('workbench.action.findInFiles')?.run()
  })

  useHotkeys('meta+g', (e) => {
    e.preventDefault()
    editorRef.current?.getAction('editor.action.goToLine')?.run()
  })

  useHotkeys('meta+shift+p', (e) => {
    e.preventDefault()
    editorRef.current?.getAction('editor.action.quickCommand')?.run()
  })

  useHotkeys('meta+/', (e) => {
    e.preventDefault()
    editorRef.current?.getAction('editor.action.commentLine')?.run()
  })

  useHotkeys('shift+alt+f', (e) => {
    e.preventDefault()
    editorRef.current?.getAction('editor.action.formatDocument')?.run()
  })

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    
    if (currentTab) {
      editor.setValue(currentTab.content)
      currentTabRef.current = currentTab.id
    }

    monaco.editor.setTheme('kriya-dark')

    // Set up editor event listeners for collaboration
    let isApplyingRemoteOperation = false
    
    // Track content changes for collaboration - FIXED: Use current state, not stale closure
    editor.onDidChangeModelContent((e: any) => {
      // Get current collaboration state from store
      const currentCollabState = useIDEStore.getState().collab
      const currentActiveTab = useIDEStore.getState().activeTab
      const currentTabs = useIDEStore.getState().tabs
      const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
      
      if (currentCollabState && !isApplyingRemoteOperation && e.changes.length > 0) {
        const change = e.changes[0]
        const operation: TextOperation = {
          type: change.text ? 'insert' : 'delete',
          position: change.rangeOffset,
          content: change.text,
          length: change.rangeLength
        }
        console.log('📤 Sending operation:', operation)
        // Use shared document ID for collaboration
        const sharedDocumentId = activeTabData ? `shared-${activeTabData.name}` : 'shared-document'
        collaborationService.sendOperation(operation, sharedDocumentId)
      }
      
      // CRITICAL FIX: Update tab content in real-time, not just on save
      if (activeTabData && !isApplyingRemoteOperation) {
        const newContent = editor.getValue()
        useIDEStore.getState().updateTabContent(activeTabData.id, newContent)
      }
    })

    // Track cursor position - FIXED: Use current state
    editor.onDidChangeCursorPosition((e: any) => {
      const currentCollabState = useIDEStore.getState().collab
      const currentActiveTab = useIDEStore.getState().activeTab
      const currentTabs = useIDEStore.getState().tabs
      const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
      
      if (currentCollabState && !isApplyingRemoteOperation && activeTabData) {
        const sharedDocumentId = `shared-${activeTabData.name}`
        collaborationService.updateCursor(e.position.lineNumber, e.position.column, sharedDocumentId)
      }
    })

    // Store reference to prevent remote operation loops
    editor._isApplyingRemoteOperation = () => isApplyingRemoteOperation
    editor._setApplyingRemoteOperation = (value: boolean) => { isApplyingRemoteOperation = value }

    // Add custom commands
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.addSelectionToNextFindMatch')?.run()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {
      editor.getAction('editor.action.selectHighlights')?.run()
    })

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.moveLinesUpAction')?.run()
    })

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.moveLinesDownAction')?.run()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      editor.getAction('editor.action.insertLineAfter')?.run()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      editor.getAction('editor.action.insertLineBefore')?.run()
    })
  }, []) // Remove dependencies to prevent recreation

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
    <div className="flex-1 h-full">
      <Editor
        height="100%"
        language={currentTab.language}
        onMount={handleEditorDidMount}
        options={EDITOR_OPTIONS}
      />
    </div>
  )
}