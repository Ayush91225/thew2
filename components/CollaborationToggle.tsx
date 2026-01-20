'use client'

import { useIDEStore } from '@/stores/ide-store-new'

export default function CollaborationToggle() {
  const { collab, setCollab } = useIDEStore()

  return (
    <button
      onClick={() => setCollab(!collab)}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
        collab 
          ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
          : 'text-zinc-700 hover:text-white hover:bg-zinc-800'
      }`}
      title={collab ? 'Disable Collaboration' : 'Enable Collaboration'}
    >
      <i className="ph-fill ph-users text-lg"></i>
    </button>
  )
}