'use client'

import { useEffect, lazy, Suspense, useState, memo, Component, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useIDEStore } from '@/stores/ide-store-fast'
import { useIDEHotkeys } from '@/hooks/useIDEHotkeys'

// Import core components directly
import TopBar from '@/components/TopBar'
import StatusBar from '@/components/StatusBar'

// Dynamic imports for better performance
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false })
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false })
const FileTabs = dynamic(() => import('@/components/FileTabs'), { ssr: false })

// Lazy load heavy components
const CommandPalette = lazy(() => import('@/components/CommandPalette'))
const AIAssistant = lazy(() => import('@/components/AIAssistant'))
const AIChatEnhanced = lazy(() => import('@/components/AIChatEnhanced'))
const Terminal = lazy(() => import('@/components/Terminal'))
const Toast = lazy(() => import('@/components/Toast'))

// Lazy load view components
const SettingsView = lazy(() => import('@/components/SettingsView'))
const DeploymentDashboard = lazy(() => import('@/components/DeploymentDashboard'))
const DatabaseView = lazy(() => import('@/components/DatabaseView'))
const LogsView = lazy(() => import('@/components/LogsView'))

const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-2">
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
))

const ErrorFallback = memo(({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div className="flex items-center justify-center p-4 text-red-400">
    <div className="text-center">
      <div className="mb-2">Something went wrong</div>
      <button onClick={resetError} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
        Try again
      </button>
    </div>
  </div>
))

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught an error:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

const MobileRestriction = memo(() => (
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
))

const MainContent = memo(({ view }: { view: string }) => {
  switch (view) {
    case 'deploy':
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <DeploymentDashboard />
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
})

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  let view: string
  let aiChatOpen: boolean
  
  try {
    const store = useIDEStore()
    view = store.view
    aiChatOpen = store.aiChatOpen
    useIDEHotkeys()
  } catch (err) {
    setError(err as Error)
    view = 'editor'
    aiChatOpen = false
  }

  useEffect(() => {
    try {
      setMounted(true)
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <ErrorFallback error={error} resetError={() => setError(null)} />
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback error={new Error('Component error')} resetError={() => window.location.reload()} />}>
      <MobileRestriction />
      <div className="hidden lg:flex flex-col h-screen">
        <ErrorBoundary fallback={<ErrorFallback error={new Error('TopBar error')} resetError={() => window.location.reload()} />}>
          <TopBar />
        </ErrorBoundary>
        
        <div className="flex flex-1 overflow-hidden">
          <ErrorBoundary fallback={<ErrorFallback error={new Error('Sidebar error')} resetError={() => window.location.reload()} />}>
            <Sidebar />
          </ErrorBoundary>
          <div className="flex flex-1 overflow-hidden">
            <ErrorBoundary fallback={<ErrorFallback error={new Error('Editor error')} resetError={() => window.location.reload()} />}>
              <MainContent view={view} />
            </ErrorBoundary>
          </div>
          {aiChatOpen && (
            <ErrorBoundary fallback={<ErrorFallback error={new Error('AI Chat error')} resetError={() => window.location.reload()} />}>
              <Suspense fallback={<LoadingSpinner />}>
                <AIChatEnhanced />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
        
        <ErrorBoundary fallback={<ErrorFallback error={new Error('StatusBar error')} resetError={() => window.location.reload()} />}>
          <StatusBar />
        </ErrorBoundary>
        
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
        <Suspense fallback={null}>
          <AIAssistant />
        </Suspense>
        <Suspense fallback={null}>
          <Terminal />
        </Suspense>
        <Suspense fallback={null}>
          <Toast />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}