'use client'

export default function LoadingScreen() {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-white text-lg font-mono">Loading Kriya IDE...</div>
        <div className="text-zinc-400 text-sm mt-2">Initializing workspace</div>
      </div>
    </div>
  )
}