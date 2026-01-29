'use client'

import { useEffect, lazy, Suspense, useState, memo } from 'react'
import dynamic from 'next/dynamic'
import { useIDEStore } from '@/stores/ide-store-fast'
import { useIDEHotkeys } from '@/hooks/useIDEHotkeys'
import AuthGuard from '@/components/auth/AuthGuard'

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
  const { view, aiChatOpen } = useIDEStore()
  const [mounted, setMounted] = useState(false)
  useIDEHotkeys()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <>
      <MobileRestriction />
      <AuthGuard>
        <div className="hidden lg:flex flex-col h-screen">
          <TopBar />
          
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 overflow-hidden">
              <MainContent view={view} />
            </div>
            {aiChatOpen && (
              <Suspense fallback={<LoadingSpinner />}>
                <AIChatEnhanced />
              </Suspense>
            )}
          </div>
          
          <StatusBar />
          
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
      </AuthGuard>
    </>
  )
}