import { StateCreator } from 'zustand'

export interface EditorSlice {
  activeTab: string | null
  tabs: Array<{
    id: string
    name: string
    path: string
    content: string
    language: string
    isDirty: boolean
    icon?: string
  }>
  fontSize: number
  tabSize: number
  minimap: boolean
  autoSave: boolean
  
  setActiveTab: (tabId: string) => void
  addTab: (tab: any) => void
  closeTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  setFontSize: (size: number) => void
  setTabSize: (size: number) => void
  setMinimap: (enabled: boolean) => void
  setAutoSave: (enabled: boolean) => void
}

export const createEditorSlice: StateCreator<any, [], [], EditorSlice> = (set, get, store) => ({
  activeTab: 'sample-html',
  tabs: [{
    id: 'sample-html',
    name: 'index.html',
    path: '/index.html',
    content: `<!DOCTYPE html>
<html>
<head><title>Kriya IDE</title></head>
<body><h1>Welcome to Kriya IDE</h1></body>
</html>`,
    language: 'html',
    isDirty: false,
    icon: 'ph ph-file-html'
  }],
  fontSize: 14,
  tabSize: 2,
  minimap: true,
  autoSave: false,
  
  setActiveTab: (tabId) => set({ activeTab: tabId }),
  
  addTab: (tab) => set((state: any) => {
    const exists = state.tabs.find((t: any) => t.path === tab.path)
    if (exists) return { activeTab: exists.id }
    return { tabs: [...state.tabs, tab], activeTab: tab.id }
  }),
  
  closeTab: (tabId) => set((state: any) => {
    const newTabs = state.tabs.filter((t: any) => t.id !== tabId)
    let newActiveTab = state.activeTab
    
    if (state.activeTab === tabId && newTabs.length > 0) {
      const index = state.tabs.findIndex((t: any) => t.id === tabId)
      newActiveTab = newTabs[Math.min(index, newTabs.length - 1)].id
    } else if (newTabs.length === 0) {
      newActiveTab = null
    }
    
    return { tabs: newTabs, activeTab: newActiveTab }
  }),
  
  updateTabContent: (tabId, content) => set((state: any) => ({
    tabs: state.tabs.map((tab: any) => 
      tab.id === tabId ? { ...tab, content, isDirty: true } : tab
    )
  })),
  
  setFontSize: (size) => set({ fontSize: size }),
  setTabSize: (size) => set({ tabSize: size }),
  setMinimap: (enabled) => set({ minimap: enabled }),
  setAutoSave: (enabled) => set({ autoSave: enabled })
})