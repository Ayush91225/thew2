'use client'

import { useEffect } from 'react'
// Components
import { ErrorBoundary } from '@/components/ErrorBoundary'
import CommandPalette from '@/components/CommandPalette'
import AIAssistant from '@/components/AIAssistant'
import YamlEditor from '@/components/YamlEditor'
import AIChatEnhanced from '@/components/AIChatEnhanced'
import GlobalSearch from '@/components/GlobalSearch'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import MainEditor from '@/components/MainEditor'
import CodeEditor from '@/components/CodeEditor'
import FileTabs from '@/components/FileTabs'
import Terminal from '@/components/Terminal'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import DeploymentDashboard from '@/components/DeploymentDashboard'
import AnalyticsView from '@/components/AnalyticsView'
import DatabaseView from '@/components/DatabaseView'
import LogsView from '@/components/LogsView'
import SettingsView from '@/components/SettingsView'
import PreviewPanel from '@/components/PreviewPanel'
import { useIDEStore } from '@/stores/ide-store'
import { useIDEHotkeys } from '@/hooks/useIDEHotkeys'

export default function Home() {
  const { view, aiChatOpen, previewOpen, loadFromURL } = useIDEStore()
  useIDEHotkeys()

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
        return <DeploymentDashboard />
      case 'monitoring':
        return <PerformanceMonitor />
      case 'analytics':
        return <AnalyticsView />
      case 'db':
        return <DatabaseView />
      case 'logs':
        return <LogsView />
      case 'settings':
        return <SettingsView />
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
      
      {/* Desktop IDE */}
      <div className="hidden lg:flex flex-col h-screen">
        <CommandPalette />
        <AIAssistant />
        <YamlEditor />
        <GlobalSearch />
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 overflow-hidden">
            {renderMainContent()}
          </div>
          {previewOpen && <PreviewPanel />}
          {aiChatOpen && <AIChatEnhanced />}
        </div>
        <Terminal />
      </div>
    </ErrorBoundary>
  )
}