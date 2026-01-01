'use client'

import { useState } from 'react'

interface FileCreatorProps {
  onFileCreate: (name: string, type: string, content?: string) => void
}

export default function FileCreator({ onFileCreate }: FileCreatorProps) {
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('txt')
  const [initialContent, setInitialContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const fileTemplates = {
    'js': 'console.log("Hello World");',
    'ts': 'console.log("Hello World");',
    'tsx': 'export default function Component() {\n  return <div>Hello World</div>\n}',
    'jsx': 'export default function Component() {\n  return <div>Hello World</div>\n}',
    'py': 'print("Hello World")',
    'html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
    'css': 'body {\n  margin: 0;\n  padding: 0;\n}',
    'json': '{\n  "name": "example",\n  "version": "1.0.0"\n}',
    'md': '# Title\n\nContent goes here...',
    'txt': ''
  }

  const handleCreate = async () => {
    if (!fileName.trim()) return
    
    setIsCreating(true)
    try {
      const content = initialContent || fileTemplates[fileType as keyof typeof fileTemplates] || ''
      const fullName = fileName.includes('.') ? fileName : `${fileName}.${fileType}`
      await onFileCreate(fullName, fileType, content)
      setFileName('')
      setInitialContent('')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-2">File Name</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">File Type</label>
        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm"
        >
          <option value="txt">Text (.txt)</option>
          <option value="js">JavaScript (.js)</option>
          <option value="ts">TypeScript (.ts)</option>
          <option value="tsx">React TypeScript (.tsx)</option>
          <option value="jsx">React JavaScript (.jsx)</option>
          <option value="py">Python (.py)</option>
          <option value="html">HTML (.html)</option>
          <option value="css">CSS (.css)</option>
          <option value="json">JSON (.json)</option>
          <option value="md">Markdown (.md)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">Initial Content (Optional)</label>
        <textarea
          value={initialContent}
          onChange={(e) => setInitialContent(e.target.value)}
          placeholder={`Template content will be used if empty:\n${fileTemplates[fileType as keyof typeof fileTemplates]}`}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm h-24 resize-none focus:border-white/20 focus:outline-none"
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={!fileName.trim() || isCreating}
        className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-sm py-2 rounded transition font-medium"
      >
        {isCreating ? 'Creating...' : 'Create File'}
      </button>
    </div>
  )
}