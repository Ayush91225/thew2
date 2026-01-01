'use client'

import { useState } from 'react'

interface FolderCreatorProps {
  onFolderCreate: (name: string, template?: string) => void
}

export default function FolderCreator({ onFolderCreate }: FolderCreatorProps) {
  const [folderName, setFolderName] = useState('')
  const [folderTemplate, setFolderTemplate] = useState('empty')
  const [isCreating, setIsCreating] = useState(false)

  const folderTemplates = {
    'empty': 'Empty folder',
    'react-component': 'React Component (index.tsx, styles.css)',
    'node-module': 'Node Module (index.js, package.json)',
    'python-package': 'Python Package (__init__.py, main.py)',
    'web-assets': 'Web Assets (css/, js/, images/)',
    'docs': 'Documentation (README.md, docs/)',
    'tests': 'Test Suite (tests/, __tests__/)'
  }

  const handleCreate = async () => {
    if (!folderName.trim()) return
    
    setIsCreating(true)
    try {
      await onFolderCreate(folderName.trim(), folderTemplate)
      setFolderName('')
      setFolderTemplate('empty')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-2">Folder Name</label>
        <input
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Enter folder name"
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">Template</label>
        <select
          value={folderTemplate}
          onChange={(e) => setFolderTemplate(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm"
        >
          {Object.entries(folderTemplates).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="text-xs text-zinc-500">
        {folderTemplate === 'empty' && 'Creates an empty folder'}
        {folderTemplate === 'react-component' && 'Creates a React component with index.tsx and styles.css'}
        {folderTemplate === 'node-module' && 'Creates a Node.js module with index.js and package.json'}
        {folderTemplate === 'python-package' && 'Creates a Python package with __init__.py and main.py'}
        {folderTemplate === 'web-assets' && 'Creates folders for CSS, JavaScript, and images'}
        {folderTemplate === 'docs' && 'Creates documentation structure with README.md'}
        {folderTemplate === 'tests' && 'Creates test directory structure'}
      </div>

      <button
        onClick={handleCreate}
        disabled={!folderName.trim() || isCreating}
        className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-sm py-2 rounded transition font-medium"
      >
        {isCreating ? 'Creating...' : 'Create Folder'}
      </button>
    </div>
  )
}