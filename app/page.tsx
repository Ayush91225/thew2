'use client'

import { useEffect, lazy, Suspense, useState } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingScreen from '@/components/LoadingScreen'
import { useIDEStore } from '@/stores/ide-store-new'
import { useIDEHotkeys } from '@/hooks/useIDEHotkeys'
import AuthGuard from '@/components/auth/AuthGuard'

// Import core components directly (no lazy loading)
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import CodeEditor from '@/components/CodeEditor'
import FileTabs from '@/components/FileTabs'
import StatusBar from '@/components/StatusBar'

// Lazy load only heavy/optional components
const CommandPalette = lazy(() => import('@/components/CommandPalette'))
const AIAssistant = lazy(() => import('@/components/AIAssistant'))
const YamlEditor = lazy(() => import('@/components/YamlEditor'))
const AIChatEnhanced = lazy(() => import('@/components/AIChatEnhanced'))
const GlobalSearch = lazy(() => import('@/components/GlobalSearch'))
const Terminal = lazy(() => import('@/components/Terminal'))
const Toast = lazy(() => import('@/components/Toast'))
const DebugPanel = lazy(() => import('@/components/DebugPanel'))

// Lazy load view components
const PerformanceMonitor = lazy(() => import('@/components/PerformanceMonitor'))
const DeploymentDashboard = lazy(() => import('@/components/DeploymentDashboard'))
const AnalyticsView = lazy(() => import('@/components/AnalyticsView'))
const DatabaseView = lazy(() => import('@/components/DatabaseView'))
const LogsView = lazy(() => import('@/components/LogsView'))
const SettingsView = lazy(() => import('@/components/SettingsView'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-2">
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function Home() {
  const { view, aiChatOpen, loadFromURL } = useIDEStore()
  const [teamContext, setTeamContext] = useState<any>(null)
  useIDEHotkeys()

  useEffect(() => {
    // Load team context and workspace from URL or localStorage
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const teamId = params.get('team')
      
      if (teamId) {
        const storedTeam = localStorage.getItem('activeTeam')
        if (storedTeam) {
          const team = JSON.parse(storedTeam)
          setTeamContext(team)
          
          // Load team workspace into IDE
          const store = useIDEStore.getState()
          
          // Convert team files to IDE tabs
          const teamTabs = team.workspace?.files?.map((file: any) => ({
            id: file.id,
            name: file.name,
            path: file.path,
            content: file.content,
            language: getLanguageFromPath(file.path),
            isDirty: false,
            icon: getIconFromPath(file.path)
          })) || []
          
          if (teamTabs.length > 0) {
            // Add each tab individually
            teamTabs.forEach((tab: any) => store.addTab(tab))
            store.setActiveTab(teamTabs[0].id)
          }
        }
      }
    }
  }, [])
  
  const getLanguageFromPath = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript', 
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown'
    }
    return langMap[ext || ''] || 'plaintext'
  }
  
  const getIconFromPath = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
      'ts': 'ph ph-file-ts',
      'tsx': 'ph ph-file-tsx', 
      'js': 'ph ph-file-js',
      'jsx': 'ph ph-file-jsx',
      'py': 'ph ph-file-py',
      'java': 'ph ph-coffee',
      'css': 'ph ph-file-css',
      'html': 'ph ph-file-html',
      'json': 'ph ph-brackets-curly',
      'md': 'ph ph-file-text'
    }
    return iconMap[ext || ''] || 'ph ph-file'
  }

  useEffect(() => {
    // Load state from URL parameters only on client side
    if (typeof window !== 'undefined') {
      // Delay to ensure hydration is complete and prevent 500 errors
      const timer = setTimeout(() => {
        try {
          loadFromURL()
        } catch (error) {
          console.warn('Failed to load from URL:', error)
        }
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Disable browser right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      // TODO: Show custom context menu
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  const renderMainContent = () => {
    switch (view) {
      case 'deploy':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DeploymentDashboard />
          </Suspense>
        )
      case 'monitoring':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PerformanceMonitor />
          </Suspense>
        )
      case 'analytics':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AnalyticsView />
          </Suspense>
        )
      case 'db':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DatabaseView />
          </Suspense>
        )
      case 'logs':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <LogsView />
          </Suspense>
        )
      case 'settings':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsView />
          </Suspense>
        )
      default:
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            <FileTabs />
            <CodeEditor />
          </div>
        )
    }
  }

  return (
    <ErrorBoundary>
      {/* Mobile restriction */}
      <div className="block lg:hidden h-screen bg-black flex items-center justify-center p-8">
        <div className="text-center">
          <div className="font-mono text-white text-lg mb-4">
            PLEASE VISIT WITH DESKTOP
          </div>
          <div className="font-mono text-zinc-400 text-sm">
            This IDE requires a larger screen
          </div>
        </div>
      </div>

      <AuthGuard>
        {/* Desktop IDE */}
        <div className="hidden lg:flex flex-col h-screen">
          {/* Team Context Banner */}
          {teamContext && (
            <div className="bg-blue-600/20 border-b border-blue-500/30 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="ph ph-users text-blue-400"></i>
                <span className="text-blue-100 font-medium">Team: {teamContext.name}</span>
                <span className="text-blue-300 text-sm">({teamContext.workspace?.sharedState?.mode || 'SOLO'} Mode)</span>
                <span className="text-blue-400 text-xs">{teamContext.description}</span>
              </div>
              <button
                onClick={() => setTeamContext(null)}
                className="text-blue-300 hover:text-white transition"
                title="Exit team view"
              >
                <i className="ph ph-x"></i>
              </button>
            </div>
          )}
          
          {/* Core IDE Components - No Suspense */}
          <TopBar />
          
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 overflow-hidden">
              {renderMainContent()}
            </div>
            {aiChatOpen && (
              <Suspense fallback={<LoadingSpinner />}>
                <AIChatEnhanced />
              </Suspense>
            )}
          </div>
          
          <StatusBar />
          
          {/* Optional Components - With Suspense */}
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
          <Suspense fallback={null}>
            <AIAssistant />
          </Suspense>
          <Suspense fallback={null}>
            <YamlEditor />
          </Suspense>
          <Suspense fallback={null}>
            <GlobalSearch />
          </Suspense>
          <Suspense fallback={null}>
            <Terminal />
          </Suspense>
          <Suspense fallback={null}>
            <Toast />
          </Suspense>
          <Suspense fallback={null}>
            <DebugPanel />
          </Suspense>
        </div>
      </AuthGuard>
    </ErrorBoundary>
  )
}