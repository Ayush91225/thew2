import { StateCreator } from 'zustand'

export interface FileTab {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirty: boolean
  icon?: string
}

export interface EditorSlice {
  activeTab: string | null
  tabs: FileTab[]
  recentFiles: string[]
  fontSize: number
  tabSize: number
  minimap: boolean
  autoSave: boolean
  isRunning: boolean
  runningFile: string | null
  
  setActiveTab: (tabId: string) => void
  addTab: (file: FileTab) => void
  closeTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  saveFile: (tabId: string) => void
  setFontSize: (size: number) => void
  setTabSize: (size: number) => void
  setMinimap: (enabled: boolean) => void
  setAutoSave: (enabled: boolean) => void
  runCurrentFile: () => void
}

export const createEditorSlice: StateCreator<EditorSlice> = (set, get) => ({
  activeTab: null,
  tabs: [],
  recentFiles: [],
  fontSize: 14,
  tabSize: 2,
  minimap: false,
  autoSave: false,
  isRunning: false,
  runningFile: null,
  
  setActiveTab: (tabId) => set({ activeTab: tabId }),
  
  addTab: (file) => set((state) => {
    const exists = state.tabs.find(t => t.path === file.path)
    if (exists) return { activeTab: exists.id }
    return { tabs: [...state.tabs, file], activeTab: file.id }
  }),
  
  closeTab: (tabId) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== tabId)
    let newActiveTab = state.activeTab
    
    if (state.activeTab === tabId && newTabs.length > 0) {
      const idx = state.tabs.findIndex(t => t.id === tabId)
      newActiveTab = newTabs[Math.min(idx, newTabs.length - 1)].id
    } else if (newTabs.length === 0) {
      newActiveTab = null
    }
    
    return { tabs: newTabs, activeTab: newActiveTab }
  }),
  
  updateTabContent: (tabId, content) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, content, isDirty: true } : t)
  })),
  
  saveFile: (tabId) => set((state) => {
    const tab = state.tabs.find(t => t.id === tabId)
    const recentFiles = tab ? [tab.path, ...state.recentFiles.filter(p => p !== tab.path)].slice(0, 10) : state.recentFiles
    return {
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, isDirty: false } : t),
      recentFiles
    }
  }),
  
  setFontSize: (size) => set({ fontSize: size }),
  setTabSize: (size) => set({ tabSize: size }),
  setMinimap: (enabled) => set({ minimap: enabled }),
  setAutoSave: (enabled) => set({ autoSave: enabled }),
  
  runCurrentFile: () => {
    const state = get() as any
    if (!state.activeTab) return
    const tab = state.tabs.find((t: FileTab) => t.id === state.activeTab)
    if (!tab) return
    set({ isRunning: true, runningFile: tab.id })
    setTimeout(() => set({ isRunning: false, runningFile: null }), 2000)
  }
})
