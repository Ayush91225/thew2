import { StateCreator } from 'zustand'

export interface UISlice {
  view: string
  activePanel: string
  commandPalette: boolean
  aiChatOpen: boolean
  terminalOpen: boolean
  globalSearch: boolean
  globalSearchQuery: string
  previewOpen: boolean
  collab: boolean
  
  setView: (view: string) => void
  setActivePanel: (panel: string) => void
  setCommandPalette: (open: boolean) => void
  setAIChatOpen: (open: boolean) => void
  setTerminalOpen: (open: boolean) => void
  setGlobalSearch: (open: boolean) => void
  setGlobalSearchQuery: (query: string) => void
  setPreviewOpen: (open: boolean) => void
  setCollab: (collab: boolean) => void
}

export const createUISlice: StateCreator<any, [], [], UISlice> = (set, get, store) => ({
  view: 'workspace',
  activePanel: 'files',
  commandPalette: false,
  aiChatOpen: false,
  terminalOpen: false,
  globalSearch: false,
  globalSearchQuery: '',
  previewOpen: false,
  collab: false,
  
  setView: (view) => set({ view }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setCommandPalette: (open) => set({ commandPalette: open }),
  setAIChatOpen: (open) => set({ aiChatOpen: open }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  setGlobalSearch: (open) => set({ globalSearch: open }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  setPreviewOpen: (open) => set({ previewOpen: open }),
  setCollab: (collab) => set({ collab })
})