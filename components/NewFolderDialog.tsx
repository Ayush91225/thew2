'use client'

import { useState } from 'react'

interface NewFolderDialogProps {
  onCreateFolder: (name: string) => void
  onCancel: () => void
}

export default function NewFolderDialog({ onCreateFolder, onCancel }: NewFolderDialogProps) {
  const [folderName, setFolderName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (folderName.trim()) {
      onCreateFolder(folderName.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-zinc-900/95 backdrop-blur border border-zinc-700/50 rounded-xl p-6 w-96 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <i className="ph ph-folder-plus text-amber-400 text-sm"></i>
          </div>
          <h3 className="text-white text-base font-semibold">Create New Folder</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="components"
              className="w-full bg-zinc-800/50 border border-zinc-600/50 text-white text-sm px-4 py-3 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm py-3 rounded-lg transition-all font-medium"
            >
              Create Folder
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm py-3 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}