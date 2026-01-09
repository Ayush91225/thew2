import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { EditorSlice, createEditorSlice } from './slices/editor-slice'
import { UISlice, createUISlice } from './slices/ui-slice'
import { DatabaseSlice, createDatabaseSlice } from './slices/database-slice'

// Combined store type
export type IDEStore = EditorSlice & UISlice & DatabaseSlice & {
  // URL persistence
  loadFromURL: () => void
  saveToURL: () => void
}

export const useIDEStore = create<IDEStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createEditorSlice(...args),
        ...createUISlice(...args),
        ...createDatabaseSlice(...args),
        
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
            
            if (panel && ['files', 'search', 'git', 'debug', 'database'].includes(panel)) {
              updates.activePanel = panel
            }
            
            if (tab) {
              const state = useIDEStore.getState()
              if (state.tabs.some(t => t.id === tab)) {
                updates.activeTab = tab
              }
            }
            
            if (search && search.length <= 100) {
              updates.globalSearchQuery = search.trim()
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
            
            if (state.view !== 'workspace') params.set('view', state.view)
            if (state.activePanel !== 'files') params.set('panel', state.activePanel)
            if (state.activeTab) params.set('tab', state.activeTab)
            if (state.globalSearchQuery) params.set('search', state.globalSearchQuery)
            
            const newURL = params.toString() 
              ? `${window.location.pathname}?${params.toString()}` 
              : window.location.pathname
              
            window.history.replaceState({}, '', newURL)
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