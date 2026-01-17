import { useIDEStore } from './ide-store-new'

// Batch state updates to prevent multiple re-renders
export const batchStateUpdates = (updates: Record<string, any>) => {
  useIDEStore.setState(updates)
}

// Debounced state updates for performance
export const createDebouncedSetter = <T>(
  setter: (value: T) => void,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout
  
  return (value: T) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => setter(value), delay)
  }
}

// State validation utilities
export const validateTabId = (tabId: string): boolean => {
  const state = useIDEStore.getState()
  return state.tabs.some(tab => tab.id === tabId)
}

export const validateView = (view: string): boolean => {
  const validViews = ['workspace', 'settings', 'deploy', 'db', 'logs', 'monitoring', 'analytics']
  return validViews.includes(view)
}

export const validatePanel = (panel: string): boolean => {
  const validPanels = ['files', 'search', 'git', 'debug', 'database', 'api', 'yaml', 'extensions']
  return validPanels.includes(panel)
}

// Performance monitoring
export const createPerformanceMonitor = () => {
  let renderCount = 0
  let lastRenderTime = Date.now()
  
  return {
    trackRender: () => {
      renderCount++
      const now = Date.now()
      const timeSinceLastRender = now - lastRenderTime
      lastRenderTime = now
      
      if (timeSinceLastRender < 16) { // Less than 60fps
        console.warn(`Fast re-render detected: ${timeSinceLastRender}ms`)
      }
    },
    getRenderCount: () => renderCount,
    reset: () => {
      renderCount = 0
      lastRenderTime = Date.now()
    }
  }
}

// Memory cleanup utilities
export const cleanupState = () => {
  const state = useIDEStore.getState()
  
  // Remove closed tabs from memory
  const activeTabs = state.tabs.filter(tab => tab.id === state.activeTab || !tab.isDirty)
  
  // Clear old query results
  if (state.results && Date.now() - new Date().getTime() > 300000) { // 5 minutes
    useIDEStore.setState({ results: null })
  }
  
  useIDEStore.setState({ tabs: activeTabs })
}