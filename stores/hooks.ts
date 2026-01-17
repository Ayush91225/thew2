import { useIDEStore } from './ide-store-new'
import { shallow } from 'zustand/shallow'

// Optimized selectors to prevent unnecessary re-renders
export const useEditorState = () => useIDEStore(
  (state) => ({
    activeTab: state.activeTab,
    tabs: state.tabs,
    fontSize: state.fontSize,
    tabSize: state.tabSize,
    minimap: state.minimap,
    autoSave: state.autoSave
  }),
  shallow
)

export const useEditorActions = () => useIDEStore(
  (state) => ({
    setActiveTab: state.setActiveTab,
    addTab: state.addTab,
    closeTab: state.closeTab,
    updateTabContent: state.updateTabContent,
    setFontSize: state.setFontSize,
    setTabSize: state.setTabSize,
    setMinimap: state.setMinimap,
    setAutoSave: state.setAutoSave
  }),
  shallow
)

export const useUIState = () => useIDEStore(
  (state) => ({
    view: state.view,
    activePanel: state.activePanel,
    commandPalette: state.commandPalette,
    aiChatOpen: state.aiChatOpen,
    terminalOpen: state.terminalOpen,
    globalSearch: state.globalSearch,
    globalSearchQuery: state.globalSearchQuery,
    previewOpen: state.previewOpen,
    collab: state.collab
  }),
  shallow
)

export const useUIActions = () => useIDEStore(
  (state) => ({
    setView: state.setView,
    setActivePanel: state.setActivePanel,
    setCommandPalette: state.setCommandPalette,
    setAIChatOpen: state.setAIChatOpen,
    setTerminalOpen: state.setTerminalOpen,
    setGlobalSearch: state.setGlobalSearch,
    setGlobalSearchQuery: state.setGlobalSearchQuery,
    setPreviewOpen: state.setPreviewOpen,
    setCollab: state.setCollab
  }),
  shallow
)

export const useDatabaseState = () => useIDEStore(
  (state) => ({
    connections: state.connections,
    activeConnection: state.activeConnection,
    query: state.query,
    results: state.results,
    loading: state.loading,
    tables: state.tables
  }),
  shallow
)

export const useDatabaseActions = () => useIDEStore(
  (state) => ({
    connectToDatabase: state.connectToDatabase,
    disconnectFromDatabase: state.disconnectFromDatabase,
    executeQuery: state.executeQuery,
    setQuery: state.setQuery,
    setActiveConnection: state.setActiveConnection,
    refreshTables: state.refreshTables
  }),
  shallow
)

// Current tab selector for performance
export const useCurrentTab = () => useIDEStore(
  (state) => state.tabs.find(tab => tab.id === state.activeTab) || null
)

// Active view selector
export const useActiveView = () => useIDEStore((state) => state.view)

// URL persistence hooks
export const useURLPersistence = () => useIDEStore(
  (state) => ({
    loadFromURL: state.loadFromURL,
    saveToURL: state.saveToURL
  }),
  shallow
)