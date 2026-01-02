'use client'

import { useIDEStore } from '@/stores/ide-store'

export default function CollaborationStatus() {
  const { collab, isConnectedToCollaboration } = useIDEStore()

  if (!collab) return null

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isConnectedToCollaboration ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className="text-zinc-500">
        {isConnectedToCollaboration ? 'Live' : 'Connecting...'}
      </span>
    </div>
  )
}