import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Minimal interfaces for fast loading
export interface FileTab {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirty: boolean
  icon?: string
}

// Fast store with only essential features
interface FastIDEStore {
  // Core editor state
  activeTab: string | null
  tabs: FileTab[]
  view: string
  activePanel: string
  
  // UI state
  commandPalette: boolean
  aiModal: boolean
  aiChatOpen: boolean
  globalSearch: boolean
  terminalOpen: boolean
  
  // Essential actions
  setActiveTab: (tabId: string) => void
  addTab: (file: FileTab) => void
  closeTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  
  setView: (view: string) => void
  setActivePanel: (panel: string) => void
  
  setCommandPalette: (open: boolean) => void
  setAIModal: (open: boolean) => void
  setAIChatOpen: (open: boolean) => void
  setGlobalSearch: (open: boolean) => void
  setTerminalOpen: (open: boolean) => void
  
  // Compatibility stubs
  gitBranch: string
  yamlFiles: any[]
  addYamlFile: (file: any) => void
  deleteYamlFile: (id: string) => void
  setActiveYamlFile: (id: string) => void
  validateYaml: (id: string) => void
  runYaml: (id: string) => void
  uploadYamlFile: (file: File) => Promise<void>
  setYamlModal: (open: boolean) => void
  collab: boolean
  runCurrentFile: () => void
  saveFile: (tabId: string) => void
}

export const useIDEStore = create<FastIDEStore>()(
  devtools((set, get) => ({
    // Initial state
    activeTab: null,
    tabs: [],
    view: 'workspace',
    activePanel: 'files',
    
    commandPalette: false,
    aiModal: false,
    aiChatOpen: false,
    globalSearch: false,
    terminalOpen: false,
    
    // Actions
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
    
    setView: (view) => set({ view }),
    setActivePanel: (panel) => set({ activePanel: panel }),
    
    setCommandPalette: (open) => set({ commandPalette: open }),
    setAIModal: (open) => set({ aiModal: open }),
    setAIChatOpen: (open) => set({ aiChatOpen: open }),
    setGlobalSearch: (open) => set({ globalSearch: open }),
    setTerminalOpen: (open) => set({ terminalOpen: open }),
    
    // Compatibility stubs
    gitBranch: 'main',
    yamlFiles: [],
    addYamlFile: () => {},
    deleteYamlFile: () => {},
    setActiveYamlFile: () => {},
    validateYaml: () => {},
    runYaml: () => {},
    uploadYamlFile: async () => {},
    setYamlModal: () => {},
    collab: false,
    runCurrentFile: () => {},
    saveFile: (tabId) => set((state) => ({
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, isDirty: false } : t)
    }))
  }))
)