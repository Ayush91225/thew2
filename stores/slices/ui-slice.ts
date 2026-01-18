import { StateCreator } from 'zustand'

export interface UISlice {
  commandPalette: boolean
  aiModal: boolean
  aiChatOpen: boolean
  settingsModal: boolean
  globalSearch: boolean
  globalSearchQuery: string
  terminalOpen: boolean
  view: string
  activePanel: string
  previewOpen: boolean
  collab: boolean
  
  setCommandPalette: (open: boolean) => void
  setAIModal: (open: boolean) => void
  setAIChatOpen: (open: boolean) => void
  setSettingsModal: (open: boolean) => void
  setGlobalSearch: (open: boolean) => void
  setGlobalSearchQuery: (query: string) => void
  setTerminalOpen: (open: boolean) => void
  setView: (view: string) => void
  setActivePanel: (panel: string) => void
  setPreviewOpen: (open: boolean) => void
  setCollab: (collab: boolean) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  commandPalette: false,
  aiModal: false,
  aiChatOpen: false,
  settingsModal: false,
  globalSearch: false,
  globalSearchQuery: '',
  terminalOpen: false,
  view: 'workspace',
  activePanel: 'files',
  previewOpen: false,
  collab: false,
  
  setCommandPalette: (open) => set({ commandPalette: open }),
  setAIModal: (open) => set({ aiModal: open }),
  setAIChatOpen: (open) => set({ aiChatOpen: open }),
  setSettingsModal: (open) => set({ settingsModal: open }),
  setGlobalSearch: (open) => set({ globalSearch: open }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  setView: (view) => set({ view }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setPreviewOpen: (open) => set({ previewOpen: open }),
  setCollab: (collab) => set({ collab }),
})
