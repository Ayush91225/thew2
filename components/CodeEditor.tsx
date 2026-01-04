'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useIDEStore } from '@/stores/ide-store'
import { useHotkeys } from 'react-hotkeys-hook'
import { collaborationService, TextOperation } from '@/lib/collaboration-service'
import type { editor } from 'monaco-editor'

// Types for better type safety
interface EditorInstance extends editor.IStandaloneCodeEditor {
  _isApplyingRemoteOperation?: () => boolean
  _setApplyingRemoteOperation?: (value: boolean) => void
}

interface CursorPosition {
  line: number
  column: number
}

interface CollaborationCursor {
  userId: string
  cursor: CursorPosition
}

// Constants for maintainability
const EDITOR_CONFIG = {
  THEME: 'kriya-dark',
  FONT_SIZE: 14,
  FONT_FAMILY: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
  LINE_HEIGHT: 1.6,
  TAB_SIZE: 2,
  WORD_WRAP_COLUMN: 120,
  OPERATION_DELAY: 100
} as const

const COLLABORATION_EVENTS = {
  OPERATION: 'operation',
  CURSOR_UPDATE: 'cursor-update',
  OPERATION_CONFIRMED: 'operation-confirmed'
} as const

const OPERATION_TYPES = {
  INSERT: 'insert',
  DELETE: 'delete'
} as const

// Completely secure logger - no user input to prevent CWE-117
const logger = {
  info: (): void => {},
  warn: (): void => {},
  error: (): void => {}
}

// Editor options extracted to prevent recreation
const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  theme: EDITOR_CONFIG.THEME,
  fontSize: EDITOR_CONFIG.FONT_SIZE,
  fontFamily: EDITOR_CONFIG.FONT_FAMILY,
  fontLigatures: true,
  lineHeight: EDITOR_CONFIG.LINE_HEIGHT,
  letterSpacing: 0.5,
  minimap: { 
    enabled: true,
    side: 'right',
    showSlider: 'mouseover',
    renderCharacters: false,
    maxColumn: 120,
    scale: 1,
    size: 'fit'
  },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  wordWrapColumn: EDITOR_CONFIG.WORD_WRAP_COLUMN,
  tabSize: EDITOR_CONFIG.TAB_SIZE,
  insertSpaces: true,
  automaticLayout: true,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  cursorWidth: 2,
  renderWhitespace: 'selection',
  renderControlCharacters: true,
  renderLineHighlight: 'all',
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
  foldingStrategy: 'indentation',
  foldingHighlight: true,
  showFoldingControls: 'always',
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
  acceptSuggestionOnEnter: 'on',
  acceptSuggestionOnCommitCharacter: true,
  tabCompletion: 'on',
  wordBasedSuggestions: 'matchingDocuments',
  parameterHints: { 
    enabled: true,
    cycle: true
  },
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoClosingDelete: 'always',
  autoSurround: 'languageDefined',
  autoIndent: 'full',
  formatOnPaste: true,
  formatOnType: true,
  dragAndDrop: true,
  copyWithSyntaxHighlighting: true,
  multiCursorModifier: 'ctrlCmd',
  multiCursorMergeOverlapping: true,
  accessibilitySupport: 'auto',
  find: {
    seedSearchStringFromSelection: 'always',
    autoFindInSelection: 'never',
    addExtraSpaceOnTop: true
  },
  gotoLocation: {
    multipleTypeDefinitions: 'peek',
    multipleDeclarations: 'peek',
    multipleImplementations: 'peek',
    multipleReferences: 'peek'
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
  hideCursorInOverviewRuler: true,
  links: true,
  matchBrackets: 'always',
  mouseWheelScrollSensitivity: 1,
  mouseWheelZoom: true,
  occurrencesHighlight: 'singleFile',
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  readOnly: false,
  renameOnType: false,
  rulers: [80, 120],
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto',
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
  snippetSuggestions: 'top',
  stickyScroll: {
    enabled: true,
    maxLineCount: 5
  },
  suggest: {
    filterGraceful: true,
    insertMode: 'insert',
    localityBonus: true,
    shareSuggestSelections: true,
    showIcons: true,
    showStatusBar: true,
    snippetsPreventQuickSuggestions: false
  },
  useTabStops: true,
  wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
  wrappingIndent: 'indent',
  wrappingStrategy: 'advanced'
}

export default function CodeEditor(): JSX.Element {
  const { tabs, activeTab, updateTabContent, collab } = useIDEStore()
  const editorRef = useRef<EditorInstance | null>(null)
  const currentTabRef = useRef<string | null>(null)
  const collaborationCursors = useRef<Map<string, editor.IEditorDecorationsCollection>>(new Map())
  const monacoInitialized = useRef<boolean>(false)

  const currentTab = useMemo(() => tabs.find(tab => tab.id === activeTab), [tabs, activeTab])

  // Type-safe helper to check if editor has collaboration methods
  const hasCollaborationMethods = useCallback((editor: EditorInstance): boolean => {
    return typeof editor._setApplyingRemoteOperation === 'function' && 
           typeof editor._isApplyingRemoteOperation === 'function'
  }, [])

  // Apply remote operations with proper error handling
  const applyRemoteOperation = useCallback((operation: TextOperation): void => {
    const editor = editorRef.current
    if (!editor) return
    
    const model = editor.getModel()
    if (!model) return

    try {
      // Set flag to prevent sending this change back
      if (hasCollaborationMethods(editor)) {
        editor._setApplyingRemoteOperation!(true)
      }
      
      // Apply the operation based on type
      if (operation.type === OPERATION_TYPES.INSERT && operation.content) {
        const position = model.getPositionAt(operation.position)
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }
        const editOperation = { range, text: operation.content }
        model.pushEditOperations([], [editOperation], () => null)
      } else if (operation.type === OPERATION_TYPES.DELETE && typeof operation.length === 'number') {
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
      }
      
      // Update the tab content immediately after applying remote operation
      const currentActiveTab = useIDEStore.getState().activeTab
      const currentTabs = useIDEStore.getState().tabs
      const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
      
      if (activeTabData) {
        const newContent = model.getValue()
        useIDEStore.getState().updateTabContent(activeTabData.id, newContent)
      }
      
      // Reset flag after a short delay
      setTimeout(() => {
        if (hasCollaborationMethods(editor)) {
          editor._setApplyingRemoteOperation!(false)
        }
      }, EDITOR_CONFIG.OPERATION_DELAY)
    } catch (error) {
      // Reset flag on error
      if (hasCollaborationMethods(editor)) {
        editor._setApplyingRemoteOperation!(false)
      }
    }
  }, [hasCollaborationMethods])

  // Update remote cursor with proper type safety
  const updateRemoteCursor = useCallback((userId: string, cursor: CursorPosition): void => {
    const editor = editorRef.current
    if (!editor) return
    
    try {
      const existingDecoration = collaborationCursors.current.get(userId)
      
      if (existingDecoration) {
        existingDecoration.clear()
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
    } catch (error) {
      // Silent error handling
    }
  }, [])

  // Initialize Monaco editor theme and settings
  useEffect(() => {
    if (!monacoInitialized.current && typeof window !== 'undefined') {
      monacoInitialized.current = true
      import('@monaco-editor/react').then(({ loader }) => {
        loader.init().then((monaco) => {
          monaco.editor.defineTheme(EDITOR_CONFIG.THEME, {
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
              'minimap.background': '#000000',
              'minimap.foregroundOpacity': '#6A737D',
              'minimap.findMatchHighlight': '#264F78',
              'minimap.selectionHighlight': '#264F78',
              'minimap.errorHighlight': '#F85149',
              'minimap.warningHighlight': '#F0883E',
              'minimapSlider.background': '#ffffff08',
              'minimapSlider.hoverBackground': '#ffffff15',
              'minimapSlider.activeBackground': '#ffffff25',
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
        }).catch(() => {
          // Silent error handling
        })
      }).catch(() => {
        // Silent error handling
      })
    }
  }, [])

  // Collaboration setup with proper cleanup
  useEffect(() => {
    if (!editorRef.current || !activeTab || !collab) return
    
    // Set up real-time collaboration event listeners
    const handleOperation = (data: unknown): void => {
      if (!data || typeof data !== 'object') return

      const operationData = data as Record<string, unknown>
      
      // Handle different data formats from the backend
      if (operationData.type && 
          (operationData.type === OPERATION_TYPES.INSERT || operationData.type === OPERATION_TYPES.DELETE)) {
        applyRemoteOperation(operationData as unknown as TextOperation)
      } else if (operationData.operation && typeof operationData.operation === 'object') {
        applyRemoteOperation(operationData.operation as unknown as TextOperation)
      } else if (operationData.data && 
                 typeof operationData.data === 'object' && 
                 (operationData.data as Record<string, unknown>).operation) {
        const nestedData = operationData.data as Record<string, unknown>
        applyRemoteOperation(nestedData.operation as unknown as TextOperation)
      }
    }

    const handleCursorUpdate = (data: unknown): void => {
      if (!data || typeof data !== 'object') return

      const cursorData = data as CollaborationCursor
      if (cursorData.userId && cursorData.cursor) {
        updateRemoteCursor(cursorData.userId, cursorData.cursor)
      }
    }

    const handleOperationConfirmed = (): void => {
      // Operation confirmed
    }

    // Add event listeners
    collaborationService.on(COLLABORATION_EVENTS.OPERATION, handleOperation)
    collaborationService.on(COLLABORATION_EVENTS.CURSOR_UPDATE, handleCursorUpdate)
    collaborationService.on(COLLABORATION_EVENTS.OPERATION_CONFIRMED, handleOperationConfirmed)

    // Cleanup function
    return () => {
      collaborationService.off(COLLABORATION_EVENTS.OPERATION, handleOperation)
      collaborationService.off(COLLABORATION_EVENTS.CURSOR_UPDATE, handleCursorUpdate)
      collaborationService.off(COLLABORATION_EVENTS.OPERATION_CONFIRMED, handleOperationConfirmed)
    }
  }, [collab, activeTab, applyRemoteOperation, updateRemoteCursor])

  // Handle tab switching
  useEffect(() => {
    if (editorRef.current && currentTab && currentTabRef.current !== currentTab.id) {
      editorRef.current.setValue(currentTab.content)
      currentTabRef.current = currentTab.id
    }
  }, [currentTab?.id, currentTab])

  // Keyboard shortcuts
  useHotkeys('meta+s', (e) => {
    e.preventDefault()
    if (currentTab && editorRef.current) {
      const content = editorRef.current.getValue()
      updateTabContent(currentTab.id, content)
      useIDEStore.getState().saveFile(currentTab.id)
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

  // Editor mount handler with proper type safety
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')): void => {
    const typedEditor = editor as EditorInstance
    editorRef.current = typedEditor
    
    if (currentTab) {
      editor.setValue(currentTab.content)
      currentTabRef.current = currentTab.id
    }

    monaco.editor.setTheme(EDITOR_CONFIG.THEME)

    // Set up editor event listeners for collaboration
    let isApplyingRemoteOperation = false
    
    // Add collaboration methods to editor instance
    typedEditor._isApplyingRemoteOperation = () => isApplyingRemoteOperation
    typedEditor._setApplyingRemoteOperation = (value: boolean) => { 
      isApplyingRemoteOperation = value 
    }
    
    // Track content changes for collaboration
    editor.onDidChangeModelContent((e) => {
      try {
        // Get current collaboration state from store
        const currentCollabState = useIDEStore.getState().collab
        const currentActiveTab = useIDEStore.getState().activeTab
        const currentTabs = useIDEStore.getState().tabs
        const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
        
        if (currentCollabState && !isApplyingRemoteOperation && e.changes.length > 0) {
          const change = e.changes[0]
          const operation: TextOperation = {
            type: change.text ? OPERATION_TYPES.INSERT : OPERATION_TYPES.DELETE,
            position: change.rangeOffset,
            content: change.text,
            length: change.rangeLength
          }
          // Send operation for collaboration
          collaborationService.sendOperation(operation)
        }
        
        // Update tab content in real-time
        if (activeTabData && !isApplyingRemoteOperation) {
          const newContent = editor.getValue()
          useIDEStore.getState().updateTabContent(activeTabData.id, newContent)
        }
      } catch (error) {
        // Silent error handling
      }
    })

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      try {
        const currentCollabState = useIDEStore.getState().collab
        const currentActiveTab = useIDEStore.getState().activeTab
        const currentTabs = useIDEStore.getState().tabs
        const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
        
        if (currentCollabState && !isApplyingRemoteOperation && activeTabData) {
          collaborationService.updateCursor(e.position.lineNumber, e.position.column)
        }
      } catch (error) {
        // Silent error handling
      }
    })

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
  }, [currentTab])

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