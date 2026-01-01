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

  // Collaboration helper functions
  const applyRemoteOperation = useCallback((operation: TextOperation) => {
    if (!editorRef.current) return
    
    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    try {
      if (operation.type === 'insert' && operation.content) {
        const position = model.getPositionAt(operation.position)
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }
        model.pushEditOperations([], [{ range, text: operation.content }], () => null)
      } else if (operation.type === 'delete' && operation.length) {
        const startPos = model.getPositionAt(operation.position)
        const endPos = model.getPositionAt(operation.position + operation.length)
        const range = {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column
        }
        model.pushEditOperations([], [{ range, text: '' }], () => null)
      }
    } catch (error) {
      console.error('Error applying remote operation:', error)
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

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    
    if (currentTab) {
      editor.setValue(currentTab.content)
      currentTabRef.current = currentTab.id
    }

    monaco.editor.setTheme('kriya-dark')

    // Collaboration setup
    if (collab && activeTab) {
      // Set up real-time collaboration
      collaborationService.on('operation', (data: any) => {
        console.log('📝 Remote operation received:', data)
        applyRemoteOperation(data.operation)
      })

      collaborationService.on('cursor-update', (data: any) => {
        console.log('👆 Remote cursor update:', data)
        updateRemoteCursor(data.userId, data.cursor)
      })

      collaborationService.on('operation-confirmed', (data: any) => {
        console.log('✅ Operation confirmed by server:', data)
      })

      // Track content changes for collaboration
      editor.onDidChangeModelContent((e: any) => {
        if (collab && e.changes.length > 0) {
          const change = e.changes[0]
          const operation: TextOperation = {
            type: change.text ? 'insert' : 'delete',
            position: change.rangeOffset,
            content: change.text,
            length: change.rangeLength
          }
          console.log('📤 Sending operation:', operation)
          collaborationService.sendOperation(operation)
        }
      })

      // Track cursor position
      editor.onDidChangeCursorPosition((e: any) => {
        if (collab) {
          collaborationService.updateCursor(e.position.lineNumber, e.position.column)
        }
      })
    }

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
  }, [currentTab, collab, activeTab, applyRemoteOperation, updateRemoteCursor])

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