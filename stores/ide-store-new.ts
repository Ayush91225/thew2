import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { EditorSlice, createEditorSlice } from './slices/editor-slice'
import { UISlice, createUISlice } from './slices/ui-slice'
import { DatabaseSlice, createDatabaseSlice } from './slices/database-slice'
import { APISlice, createAPISlice } from './slices/api-slice'

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
  
  // Extensions state
  extensions: Extension[]
  extensionSearchQuery: string
  marketplaceExtensions: any[]
  marketplaceLoading: boolean
  marketplaceCategories: string[]
  
  // Database state (additional properties)
  databaseConnections: DatabaseConnection[]
  activeDatabaseConnection: string | null
  databaseQuery: string
  queryResults: QueryResult | null
  queryLoading: boolean
  databaseTables: string[]
  
  // Collaboration state
  collaborationUsers: any[]
  isConnectedToCollaboration: boolean
  
  // Git state
  gitBranch: string
  gitStatus: string
  uncommittedChanges: number
  
  // Debug actions
  toggleBreakpoint: (file: string, line: number) => void
  startDebugSession: () => void
  stopDebugSession: () => void
  
  // Extension actions
  setExtensionSearchQuery: (query: string) => void
  toggleExtension: (id: string) => void
  updateExtension: (id: string) => void
  installExtension: (extension: any) => void
  uninstallExtension: (id: string) => void
  searchMarketplaceExtensions: (query?: string, category?: string) => void
  checkForExtensionUpdates: () => void
  executeExtensionCommand: (command: string, ...args: any[]) => Promise<void>
  
  // Database actions (additional)
  connectToDatabase: (config: any) => Promise<void>
  disconnectFromDatabase: (connectionId: string) => Promise<void>
  executeQuery: (connectionId: string, sql: string) => Promise<void>
  setDatabaseQuery: (query: string) => void
  setActiveDatabaseConnection: (connectionId: string | null) => void
  refreshDatabaseTables: (connectionId: string) => Promise<void>
  
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
  
  // Extensions state
  extensions: [],
  extensionSearchQuery: '',
  marketplaceExtensions: [],
  marketplaceLoading: false,
  marketplaceCategories: ['All'],
  
  // Database state
  databaseConnections: [],
  activeDatabaseConnection: null,
  databaseQuery: '',
  queryResults: null,
  queryLoading: false,
  databaseTables: [],
  
  // Collaboration state
  collaborationUsers: [],
  isConnectedToCollaboration: false,
  
  // Git state
  gitBranch: 'main',
  gitStatus: 'clean',
  uncommittedChanges: 0,
  
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
  
  // Extension actions
  setExtensionSearchQuery: (query: string) => set({ extensionSearchQuery: query }),
  toggleExtension: async (id: string) => {},
  updateExtension: async (id: string) => {},
  installExtension: async (extension: any) => {},
  uninstallExtension: async (id: string) => {},
  searchMarketplaceExtensions: async (query?: string, category?: string) => {},
  checkForExtensionUpdates: async () => {},
  executeExtensionCommand: async (command: string, ...args: any[]) => {},
  
  // Database actions
  connectToDatabase: async (config: any) => {},
  disconnectFromDatabase: async (connectionId: string) => {},
  executeQuery: async (connectionId: string, sql: string) => {},
  setDatabaseQuery: (query: string) => set({ databaseQuery: query }),
  setActiveDatabaseConnection: (connectionId: string | null) => set({ activeDatabaseConnection: connectionId }),
  refreshDatabaseTables: async (connectionId: string) => {},
  
  // Collaboration actions
  setCollaborationConnection: (connected: boolean) => set({ isConnectedToCollaboration: connected }),
  setCollaborationUsers: (users: any[]) => set({ collaborationUsers: users }),
  addCollaborationUser: (user: any) => set((state: any) => ({ collaborationUsers: [...state.collaborationUsers, user] })),
  removeCollaborationUser: (userId: string) => set((state: any) => ({ collaborationUsers: state.collaborationUsers.filter((u: any) => u.id !== userId) }))
})

// Combined store type
export type IDEStore = EditorSlice & UISlice & DatabaseSlice & APISlice & CompatibilitySlice & {
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
        ...createCompatibilitySlice(set, get),
        
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
          tabs: state.tabs,
          activeTab: state.activeTab,
          fontSize: state.fontSize,
          tabSize: state.tabSize,
          minimap: state.minimap,
          autoSave: state.autoSave,
          view: state.view,
          activePanel: state.activePanel,
          collab: state.collab,
          terminalOpen: state.terminalOpen
        })
      }
    )
  )
)

// Expose store globally for external access
if (typeof window !== 'undefined') {
  (window as any).useIDEStore = useIDEStore
}