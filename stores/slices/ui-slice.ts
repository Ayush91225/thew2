import { StateCreator } from 'zustand'

interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface UISlice {
  commandPalette: boolean
  aiModal: boolean
  aiChatOpen: boolean
  settingsModal: boolean
  settingsOpen: boolean
  yamlModal: boolean
  globalSearch: boolean
  globalSearchQuery: string
  terminalOpen: boolean
  view: string
  previousView: string
  activePanel: string
  previewOpen: boolean
  collab: boolean
  environment: 'production' | 'development'
  aiMessages: AIMessage[]
  aiInputValue: string
  
  setCommandPalette: (open: boolean) => void
  setAIModal: (open: boolean) => void
  setAIChatOpen: (open: boolean) => void
  setSettingsModal: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setYamlModal: (open: boolean) => void
  setGlobalSearch: (open: boolean) => void
  setGlobalSearchQuery: (query: string) => void
  setTerminalOpen: (open: boolean) => void
  setView: (view: string) => void
  setActivePanel: (panel: string) => void
  setPreviewOpen: (open: boolean) => void
  setCollab: (collab: boolean) => void
  setEnvironment: (env: 'production' | 'development') => void
  addAIMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void
  setAIInputValue: (value: string) => void
  clearAIChat: () => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  commandPalette: false,
  aiModal: false,
  aiChatOpen: false,
  settingsModal: false,
  settingsOpen: false,
  yamlModal: false,
  globalSearch: false,
  globalSearchQuery: '',
  terminalOpen: false,
  view: 'workspace',
  previousView: 'workspace',
  activePanel: 'files',
  previewOpen: false,
  collab: false,
  environment: 'production',
  aiMessages: [],
  aiInputValue: '',
  
  setCommandPalette: (open) => set({ commandPalette: open }),
  setAIModal: (open) => set({ aiModal: open }),
  setAIChatOpen: (open) => set({ aiChatOpen: open }),
  setSettingsModal: (open) => set({ settingsModal: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setYamlModal: (open) => set({ yamlModal: open }),
  setGlobalSearch: (open) => set({ globalSearch: open }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  setView: (view) => set({ view }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setPreviewOpen: (open) => set({ previewOpen: open }),
  setCollab: (collab) => set({ collab }),
  setEnvironment: (env) => set({ environment: env }),
  addAIMessage: (message) => set((state) => ({
    aiMessages: [...state.aiMessages, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }]
  })),
  setAIInputValue: (value) => set({ aiInputValue: value }),
  clearAIChat: () => set({ aiMessages: [], aiInputValue: '' }),
})
