'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useIDEStore } from '@/stores/ide-store-new'
import { useHotkeys } from 'react-hotkeys-hook'
import { collaborationService, TextOperation } from '@/lib/collaboration-service-real'
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
  OPERATION_DELAY: 100,
  MAX_DELETE_LENGTH: 10000 // Maximum characters that can be deleted in one operation
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

// Secure logger with no user input to prevent CWE-117
const logger = {
  info: (message: string): void => {
    console.info(`[CodeEditor] ${message}`)
  },
  warn: (message: string): void => {
    console.warn(`[CodeEditor] ${message}`)
  },
  error: (message: string): void => {
    console.error(`[CodeEditor] ${message}`)
  }
}

// Helper function to sanitize content for XSS prevention
const sanitizeForXSS = (content: string): string => {
  return content.replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return entities[match] || match
  })
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
  rulers: [],
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
  const timeoutRefs = useRef<{ change: NodeJS.Timeout | null; cursor: NodeJS.Timeout | null }>({ change: null, cursor: null })

  const currentTab = useMemo(() => tabs.find(tab => tab.id === activeTab), [tabs, activeTab])

  // Type-safe helper to check if editor has collaboration methods
  const hasCollaborationMethods = useCallback((editor: EditorInstance): boolean => {
    return typeof editor._setApplyingRemoteOperation === 'function' && 
           typeof editor._isApplyingRemoteOperation === 'function'
  }, [])

  // Apply remote operations with proper error handling
  const applyRemoteOperation = useCallback((operation: TextOperation): void => {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    
    const model = editor.getModel()
    if (!model) {
      return
    }

    try {
      // Set flag to prevent sending this change back
      if (hasCollaborationMethods(editor)) {
        editor._setApplyingRemoteOperation!(true)
      }
      
      // Validate and sanitize operation data
      if (!operation.type || !['insert', 'delete', 'replace'].includes(operation.type)) {
        return
      }
      
      // Apply operation with precise positioning
      if (operation.type === OPERATION_TYPES.INSERT && operation.content) {
        // Sanitize content to prevent XSS
        const sanitizedContent = sanitizeForXSS(operation.content)
        
        let range
        if (operation.range) {
          // Validate range bounds
          const lineCount = model.getLineCount()
          const startLine = Math.max(1, Math.min(operation.range.startLine, lineCount))
          const endLine = Math.max(1, Math.min(operation.range.endLine, lineCount))
          const startColumn = Math.max(1, operation.range.startColumn)
          const endColumn = Math.max(1, operation.range.endColumn)
          
          range = {
            startLineNumber: startLine,
            startColumn: startColumn,
            endLineNumber: endLine,
            endColumn: endColumn
          }
        } else {
          // Fallback to position-based calculation with bounds checking
          const maxOffset = model.getValueLength()
          const safePosition = Math.max(0, Math.min(operation.position, maxOffset))
          const position = model.getPositionAt(safePosition)
          range = {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          }
        }
        
        const editOperation = { range, text: sanitizedContent }
        model.pushEditOperations([], [editOperation], () => null)
        
      } else if (operation.type === 'replace' && operation.content) {
        // Handle replace operation for document sync
        const currentContent = model.getValue()
        if (currentContent !== operation.content) {
          model.setValue(operation.content)
        }
        
      } else if (operation.type === OPERATION_TYPES.DELETE && typeof operation.length === 'number') {
        // Validate delete length
        const safeLength = Math.max(0, Math.min(operation.length, EDITOR_CONFIG.MAX_DELETE_LENGTH))
        
        let range
        if (operation.range) {
          // Validate range bounds
          const lineCount = model.getLineCount()
          const startLine = Math.max(1, Math.min(operation.range.startLine, lineCount))
          const endLine = Math.max(1, Math.min(operation.range.endLine, lineCount))
          const startColumn = Math.max(1, operation.range.startColumn)
          const endColumn = Math.max(1, operation.range.endColumn)
          
          range = {
            startLineNumber: startLine,
            startColumn: startColumn,
            endLineNumber: endLine,
            endColumn: endColumn
          }
        } else {
          // Fallback to position-based calculation with bounds checking
          const maxOffset = model.getValueLength()
          const safePosition = Math.max(0, Math.min(operation.position, maxOffset))
          const safeEndPosition = Math.max(0, Math.min(operation.position + safeLength, maxOffset))
          const startPos = model.getPositionAt(safePosition)
          const endPos = model.getPositionAt(safeEndPosition)
          range = {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column
          }
        }
        
        const editOperation = { range, text: '' }
        model.pushEditOperations([], [editOperation], () => null)
      }
      
      // Update tab content after remote operation
      const currentActiveTab = useIDEStore.getState().activeTab
      const currentTabs = useIDEStore.getState().tabs
      const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
      
      if (activeTabData) {
        const newContent = model.getValue()
        
        // Use direct state update to avoid triggering collaboration sync
        useIDEStore.setState((state) => ({
          tabs: state.tabs.map(tab => 
            tab.id === activeTabData.id 
              ? { ...tab, content: newContent, isDirty: false }
              : tab
          )
        }))
      }
      
    } catch (error) {
      // Silent error handling
    } finally {
      // Reset flag after operation with proper error handling
      setTimeout(() => {
        try {
          if (hasCollaborationMethods(editor)) {
            editor._setApplyingRemoteOperation!(false)
          }
        } catch (error) {
          // Silent error handling
        }
      }, 100)
    }
  }, [hasCollaborationMethods])

  // Update remote cursor with proper type safety and validation
  const updateRemoteCursor = useCallback((userId: string, cursor: CursorPosition): void => {
    const editor = editorRef.current
    if (!editor) {
      logger.warn('Editor not available for cursor update')
      return
    }
    
    try {
      // Validate cursor position
      if (typeof cursor.line !== 'number' || typeof cursor.column !== 'number') {
        logger.warn('Invalid cursor position data')
        return
      }
      
      // Sanitize userId to prevent XSS
      const sanitizedUserId = sanitizeForXSS(userId)
      
      // Validate cursor bounds
      const model = editor.getModel()
      if (!model) return
      
      const lineCount = model.getLineCount()
      const safeLine = Math.max(1, Math.min(cursor.line, lineCount))
      const lineLength = model.getLineLength(safeLine)
      const safeColumn = Math.max(1, Math.min(cursor.column, lineLength + 1))
      
      const existingDecoration = collaborationCursors.current.get(sanitizedUserId)
      
      if (existingDecoration) {
        existingDecoration.clear()
      }

      const decorations = editor.createDecorationsCollection([
        {
          range: {
            startLineNumber: safeLine,
            startColumn: safeColumn,
            endLineNumber: safeLine,
            endColumn: safeColumn
          },
          options: {
            className: `collaboration-cursor-${sanitizedUserId.replace(/[^a-zA-Z0-9-_]/g, '')}`,
            hoverMessage: { value: `User ${sanitizedUserId}` }
          }
        }
      ])
      
      collaborationCursors.current.set(sanitizedUserId, decorations)
    } catch (error) {
      logger.error('Failed to update remote cursor')
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
        }).catch((error) => {
          logger.error('Failed to initialize Monaco theme')
        })
      }).catch((error) => {
        logger.error('Failed to load Monaco editor')
      })
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRefs.current.change) {
        clearTimeout(timeoutRefs.current.change)
      }
      if (timeoutRefs.current.cursor) {
        clearTimeout(timeoutRefs.current.cursor)
      }
    }
  }, [])

  // Handle tab switching - FIXED to preserve content
  useEffect(() => {
    if (editorRef.current && currentTab) {
      const model = editorRef.current.getModel()
      if (model && currentTabRef.current !== currentTab.id) {
        // Save current tab content before switching
        if (currentTabRef.current) {
          const currentContent = model.getValue()
          updateTabContent(currentTabRef.current, currentContent)
        }
        
        // Set flag to prevent triggering collaboration during tab switch
        const editor = editorRef.current as EditorInstance
        if (hasCollaborationMethods(editor)) {
          editor._setApplyingRemoteOperation!(true)
        }
        
        // Load new tab content
        model.setValue(currentTab.content || '')
        currentTabRef.current = currentTab.id
        
        // Reset flag after a short delay
        setTimeout(() => {
          if (hasCollaborationMethods(editor)) {
            editor._setApplyingRemoteOperation!(false)
          }
        }, 100)
      }
    }
  }, [currentTab?.id, currentTab, updateTabContent, hasCollaborationMethods])

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
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run()
    }
  })

  // Format document function that uses extensions
  const handleFormatDocument = useCallback(async () => {
    if (!editorRef.current || !currentTab) return
    
    try {
      // Use Monaco's built-in formatter
      editorRef.current.getAction('editor.action.formatDocument')?.run()
    } catch (error) {
      console.warn('Format failed:', error)
    }
  }, [currentTab])


  // Editor mount handler with proper type safety
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')): void => {
    const typedEditor = editor as EditorInstance
    editorRef.current = typedEditor
    
    try {
      if (currentTab) {
        const model = editor.getModel()
        if (model) {
          editor.setValue(currentTab.content)
          currentTabRef.current = currentTab.id
        }
      }

      monaco.editor.setTheme(EDITOR_CONFIG.THEME)
    } catch (error) {
      console.warn('Failed to initialize editor:', error)
      return
    }

    // Set up collaboration listeners after editor is ready
    logger.info('Setting up collaboration listeners after editor mount')
    
    // Set up real-time collaboration event listeners with validation
    const handleOperation = (data: unknown): void => {
      if (!data || typeof data !== 'object') {
        return
      }

      const operationData = data as Record<string, unknown>
      
      // Validate operation data structure
      const isValidOperation = (op: unknown): op is TextOperation => {
        if (!op || typeof op !== 'object') return false
        const operation = op as Record<string, unknown>
        return typeof operation.type === 'string' && 
               ['insert', 'delete', 'replace'].includes(operation.type) &&
               (typeof operation.position === 'number' || operation.type === 'replace')
      }
      
      // Handle different data formats from the backend
      if (isValidOperation(operationData)) {
        applyRemoteOperation(operationData as TextOperation)
      } else if (operationData.operation && isValidOperation(operationData.operation)) {
        applyRemoteOperation(operationData.operation as TextOperation)
      } else if (operationData.data && 
                 typeof operationData.data === 'object' && 
                 (operationData.data as Record<string, unknown>).operation &&
                 isValidOperation((operationData.data as Record<string, unknown>).operation)) {
        const nestedData = operationData.data as Record<string, unknown>
        applyRemoteOperation(nestedData.operation as TextOperation)
      }
    }

    const handleCursorUpdate = (data: unknown): void => {
      if (!data || typeof data !== 'object') {
        return
      }

      const cursorData = data as CollaborationCursor
      if (cursorData.userId && cursorData.cursor && 
          typeof cursorData.userId === 'string' &&
          typeof cursorData.cursor === 'object' &&
          typeof cursorData.cursor.line === 'number' &&
          typeof cursorData.cursor.column === 'number') {
        updateRemoteCursor(cursorData.userId, cursorData.cursor)
      }
    }

    const handleOperationConfirmed = (): void => {
      // Operation confirmed
    }

    collaborationService.on(COLLABORATION_EVENTS.OPERATION, handleOperation)
    collaborationService.on(COLLABORATION_EVENTS.CURSOR_UPDATE, handleCursorUpdate)
    collaborationService.on(COLLABORATION_EVENTS.OPERATION_CONFIRMED, handleOperationConfirmed)

    // Set up editor event listeners for collaboration
    let isApplyingRemoteOperation = false
    
    // Add collaboration methods to editor instance
    typedEditor._isApplyingRemoteOperation = () => isApplyingRemoteOperation
    typedEditor._setApplyingRemoteOperation = (value: boolean) => { 
      isApplyingRemoteOperation = value 
    }
    
    // Track content changes for real-time collaboration with throttling
    editor.onDidChangeModelContent((e) => {
      try {
        const currentCollabState = useIDEStore.getState().collab
        const currentActiveTab = useIDEStore.getState().activeTab
        const currentTabs = useIDEStore.getState().tabs
        const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
        
        // Only send operations if this is a local change (not from remote)
        if (currentCollabState && !isApplyingRemoteOperation && e.changes.length > 0) {
          // Ensure document is joined before sending operations
          if (!collaborationService.getCurrentDocumentId()) {
            collaborationService.joinDocument('shared-document', 'live')
          }
          
          // Clear previous timeout
          if (timeoutRefs.current.change) {
            clearTimeout(timeoutRefs.current.change)
            timeoutRefs.current.change = null
          }
          
          timeoutRefs.current.change = setTimeout(() => {
            try {
              // Only send if we're still not applying remote operations
              if (!isApplyingRemoteOperation) {
                const fullContent = editor.getValue()
                
                collaborationService.sendOperation({
                  type: 'replace',
                  content: fullContent,
                  position: 0
                })
              }
            } catch (error) {
              // Silent error handling for timeout operations
            } finally {
              timeoutRefs.current.change = null
            }
          }, 300)
        }
        
        // Update tab content in real-time (but don't trigger collaboration sync)
        if (activeTabData && !isApplyingRemoteOperation) {
          const newContent = editor.getValue()
          // Use direct state update to avoid triggering collaboration sync
          useIDEStore.setState((state) => ({
            tabs: state.tabs.map(tab => 
              tab.id === activeTabData.id 
                ? { ...tab, content: newContent, isDirty: false }
                : tab
            )
          }))
        }
      } catch (error) {
        logger.error('Failed to handle content change')
      }
    })

    // Track cursor position for real-time collaboration with throttling
    editor.onDidChangeCursorPosition((e) => {
      try {
        const currentCollabState = useIDEStore.getState().collab
        const currentActiveTab = useIDEStore.getState().activeTab
        const currentTabs = useIDEStore.getState().tabs
        const activeTabData = currentTabs.find(tab => tab.id === currentActiveTab)
        
        // Always allow cursor movement, only throttle collaboration updates
        if (currentCollabState && activeTabData) {
          // Clear previous timeout
          if (timeoutRefs.current.cursor) {
            clearTimeout(timeoutRefs.current.cursor)
            timeoutRefs.current.cursor = null
          }
          
          timeoutRefs.current.cursor = setTimeout(() => {
            try {
              // Only send cursor updates if not applying remote operations
              if (!isApplyingRemoteOperation && e.position && typeof e.position.lineNumber === 'number' && typeof e.position.column === 'number') {
                const safeLine = Math.max(1, e.position.lineNumber)
                const safeColumn = Math.max(1, e.position.column)
                collaborationService.updateCursor(safeLine, safeColumn)
              }
            } catch (error) {
              // Silent error handling for timeout operations
            } finally {
              timeoutRefs.current.cursor = null
            }
          }, 100)
        }
      } catch (error) {
        logger.error('Failed to handle cursor change')
      }
    })

    // Add custom commands and context menu
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

    // Add extension commands to context menu
    editor.addAction({
      id: 'extension.prettier.format',
      label: '⚡ Format with Prettier',
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1,
      run: () => handleFormatDocument()
    })

    editor.addAction({
      id: 'extension.liveServer.start',
      label: '🚀 Start Live Server',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: async () => {
        try {
          const { extensionManager } = await import('@/lib/extension-manager')
          const loadedExtensions = extensionManager.getLoadedExtensions()
          
          if (!loadedExtensions.includes('live-server')) {
            await extensionManager.loadExtension('live-server')
          }
          
          await extensionManager.executeCommand('liveServer.start')
        } catch (error) {
          console.warn('Live Server command failed:', error)
        }
      }
    })

    editor.addAction({
      id: 'extension.liveServer.stop',
      label: '🛑 Stop Live Server',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 2,
      run: async () => {
        try {
          const { extensionManager } = await import('@/lib/extension-manager')
          const loadedExtensions = extensionManager.getLoadedExtensions()
          
          if (!loadedExtensions.includes('live-server')) {
            await extensionManager.loadExtension('live-server')
          }
          
          await extensionManager.executeCommand('liveServer.stop')
        } catch (error) {
          console.warn('Live Server command failed:', error)
        }
      }
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
    <div className="flex-1 h-full flex flex-col">
      {/* Breadcrumb Path with Format Button */}
      <div className="h-9 px-4 flex items-center justify-between bg-zinc-950/80 border-b border-zinc-800/50 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <i className="ph ph-folder-simple text-zinc-500"></i>
          {currentTab.path.split('/').filter(Boolean).map((segment, index, array) => {
            // Sanitize path segments to prevent XSS
            const sanitizedSegment = segment.replace(/[<>"'&]/g, (match) => {
              const entities: Record<string, string> = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
              }
              return entities[match] || match
            })
            
            return (
              <div key={index} className="flex items-center gap-1.5">
                <span className={index === array.length - 1 ? 'text-zinc-200 font-medium' : 'text-zinc-400 hover:text-zinc-300 cursor-pointer'}>
                  {sanitizedSegment}
                </span>
                {index < array.length - 1 && (
                  <i className="ph ph-caret-right text-zinc-600 text-xs"></i>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Format Button */}
        <button
          onClick={handleFormatDocument}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          title="Format Document (Shift+Alt+F)"
        >
          <span className="text-xs">⚡</span>
          Format
        </button>
      </div>
      
      {/* Monaco Editor */}
      <div className="flex-1 relative">
        {currentTab && (
          <div className="absolute inset-0">
            <Editor
              height="100%"
              width="100%"
              language={currentTab.language}
              onMount={handleEditorDidMount}
              options={{
                ...EDITOR_OPTIONS,
                automaticLayout: true,
                scrollBeyondLastLine: false
              }}
              loading={<div className="flex items-center justify-center h-full text-zinc-400">Loading editor...</div>}
            />
          </div>
        )}
      </div>
    </div>
  )
}