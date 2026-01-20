import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { EditorSlice, createEditorSlice } from './slices/editor-slice'
import { UISlice, createUISlice } from './slices/ui-slice'
import { DatabaseSlice, createDatabaseSlice } from './slices/database-slice'
import { APISlice, createAPISlice } from './slices/api-slice'
import { SettingsSlice, createSettingsSlice } from './slices/settings-slice'
import { AuthSlice, createAuthSlice } from './slices/auth-slice'

// Additional interfaces for compatibility
interface Extension {
  id: string
  name: string
  version: string
  category: string
  downloads: string
  status: 'active' | 'disabled' | 'update-available'
  icon: string
}

interface DatabaseConnection {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'
  host: string
  port?: number
  database: string
  username: string
  isConnected: boolean
  createdAt: Date
}

interface QueryResult {
  rows: any[]
  rowCount: number
  executionTime: number
}

// Additional slices for compatibility
interface CompatibilitySlice {
  // Debug state
  breakpoints: Record<string, number[]>
  debugSession: boolean

  // Git state
  gitBranch: string
  gitStatus: string
  uncommittedChanges: number

  // Project state
  projectRoot: string | null
  projectFiles: any[]

  // Terminal state
  terminalTabs: any[]
  activeTerminalTab: string | null

  // YAML state
  yamlFiles: any[]
  activeYamlFile: string | null

  // Collaboration state
  collaborationUsers: any[]
  isConnectedToCollaboration: boolean

  // Debug actions
  toggleBreakpoint: (file: string, line: number) => void
  startDebugSession: () => void
  stopDebugSession: () => void

  // Project actions
  setProjectRoot: (path: string | null) => void
  setProjectFiles: (files: any[]) => void

  // Terminal actions
  addTerminalTab: (tab: any) => void
  closeTerminalTab: (tabId: string) => void
  setActiveTerminalTab: (tabId: string) => void

  // YAML actions
  addYamlFile: (file: any) => void
  updateYamlFile: (id: string, content: string) => void
  deleteYamlFile: (id: string) => void
  setActiveYamlFile: (id: string) => void
  validateYaml: (id: string) => void
  runYaml: (id: string) => void
  uploadYamlFile: (file: File) => Promise<void>

  // Collaboration actions
  setCollaborationConnection: (connected: boolean) => void
  setCollaborationUsers: (users: any[]) => void
  addCollaborationUser: (user: any) => void
  removeCollaborationUser: (userId: string) => void
}

const createCompatibilitySlice = (set: any, get: any): CompatibilitySlice => ({
  // Debug state
  breakpoints: {},
  debugSession: false,

  // Git state
  gitBranch: 'main',
  gitStatus: 'clean',
  uncommittedChanges: 0,

  // Project state
  projectRoot: null,
  projectFiles: [],

  // Terminal state
  terminalTabs: [{ id: 'bash-1', name: 'bash', type: 'bash', isActive: true }],
  activeTerminalTab: 'bash-1',

  // YAML state
  yamlFiles: [],
  activeYamlFile: null,

  // Collaboration state
  collaborationUsers: [],
  isConnectedToCollaboration: false,

  // Debug actions
  toggleBreakpoint: (file: string, line: number) => set((state: any) => {
    const fileBreakpoints = state.breakpoints[file] || []
    const hasBreakpoint = fileBreakpoints.includes(line)
    return {
      breakpoints: {
        ...state.breakpoints,
        [file]: hasBreakpoint
          ? fileBreakpoints.filter((l: number) => l !== line)
          : [...fileBreakpoints, line].sort((a: number, b: number) => a - b)
      }
    }
  }),

  startDebugSession: () => set({ debugSession: true }),
  stopDebugSession: () => set({ debugSession: false }),

  // Project actions
  setProjectRoot: (path: string | null) => set({ projectRoot: path }),
  setProjectFiles: (files: any[]) => set({ projectFiles: files }),

  // Terminal actions
  addTerminalTab: (tab: any) => set((state: any) => ({ terminalTabs: [...state.terminalTabs, tab], activeTerminalTab: tab.id })),
  closeTerminalTab: (tabId: string) => set((state: any) => ({ terminalTabs: state.terminalTabs.filter((t: any) => t.id !== tabId) })),
  setActiveTerminalTab: (tabId: string) => set({ activeTerminalTab: tabId }),

  // YAML actions
  addYamlFile: (file: any) => set((state: any) => ({ yamlFiles: [...state.yamlFiles, file], activeYamlFile: file.id })),
  updateYamlFile: (id: string, content: string) => set((state: any) => ({ yamlFiles: state.yamlFiles.map((f: any) => f.id === id ? { ...f, content } : f) })),
  deleteYamlFile: (id: string) => set((state: any) => ({ yamlFiles: state.yamlFiles.filter((f: any) => f.id !== id), activeYamlFile: state.activeYamlFile === id ? null : state.activeYamlFile })),
  setActiveYamlFile: (id: string) => set({ activeYamlFile: id }),
  validateYaml: (id: string) => { },
  runYaml: (id: string) => { },
  uploadYamlFile: async (file: File) => { },

  // Collaboration actions
  setCollaborationConnection: (connected: boolean) => set({ isConnectedToCollaboration: connected }),
  setCollaborationUsers: (users: any[]) => set({ collaborationUsers: users }),
  addCollaborationUser: (user: any) => set((state: any) => ({ collaborationUsers: [...state.collaborationUsers, user] })),
  removeCollaborationUser: (userId: string) => set((state: any) => ({ collaborationUsers: state.collaborationUsers.filter((u: any) => u.id !== userId) }))
})

// Combined store type
export type IDEStore = EditorSlice & UISlice & DatabaseSlice & APISlice & SettingsSlice & CompatibilitySlice & AuthSlice & {
  // URL persistence
  loadFromURL: () => void
  saveToURL: () => void
}

export const useIDEStore = create<IDEStore>()(
  devtools(
    persist(
      (set, get, store) => ({
        ...createEditorSlice(set, get, store),
        ...createUISlice(set, get, store),
        ...createDatabaseSlice(set, get, store),
        ...createAPISlice(set, get, store),
        ...createSettingsSlice(set, get, store),
        ...createCompatibilitySlice(set, get),
        ...createAuthSlice(set, get, store),

        // URL persistence methods
        loadFromURL: () => {
          if (typeof window === 'undefined') return

          try {
            const params = new URLSearchParams(window.location.search)
            const updates: Partial<IDEStore> = {}

            const view = params.get('view')
            const panel = params.get('panel')
            const tab = params.get('tab')
            const search = params.get('search')

            if (view && ['workspace', 'settings', 'deploy', 'db', 'logs'].includes(view)) {
              updates.view = view
            }

            if (panel && ['files', 'search', 'git', 'debug', 'database', 'api', 'yaml', 'extensions'].includes(panel)) {
              updates.activePanel = panel
            }

            if (tab && tab.length < 100) {
              const state = useIDEStore.getState()
              if (state.tabs.some(t => t.id === tab)) {
                updates.activeTab = tab
              }
            }

            if (search && search.length <= 100) {
              const sanitized = search.replace(/[<>"'&\r\n\t]/g, '').trim()
              if (sanitized && !sanitized.includes('..')) {
                updates.globalSearchQuery = sanitized
              }
            }

            if (Object.keys(updates).length > 0) {
              useIDEStore.setState(updates)
            }
          } catch (error) {
            console.warn('Failed to load from URL:', error)
          }
        },

        saveToURL: () => {
          if (typeof window === 'undefined') return

          try {
            const state = useIDEStore.getState()
            const params = new URLSearchParams()

            if (state.view && state.view !== 'workspace') {
              params.set('view', state.view)
            }

            if (state.activePanel && state.activePanel !== 'files') {
              params.set('panel', state.activePanel)
            }

            if (state.activeTab && state.activeTab.length < 100) {
              params.set('tab', state.activeTab)
            }

            if (state.globalSearchQuery && state.globalSearchQuery.trim() && state.globalSearchQuery.length <= 100) {
              params.set('search', state.globalSearchQuery.trim())
            }

            const newURL = params.toString()
              ? `${window.location.pathname}?${params.toString()}`
              : window.location.pathname

            if (newURL !== window.location.href) {
              window.history.replaceState({}, '', newURL)
            }
          } catch (error) {
            console.warn('Failed to save to URL:', error)
          }
        }
      }),
      {
        name: 'kriya-ide-storage',
        partialize: (state) => ({
          // Only persist essential data
          activeTab: state.activeTab,
          view: state.view,
          activePanel: state.activePanel,
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
)

// Expose store globally for external access
if (typeof window !== 'undefined') {
  (window as any).useIDEStore = useIDEStore
}