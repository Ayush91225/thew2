'use client'

import { useIDEStore } from '@/stores/ide-store'
import { FileTreeManager, FileTreeNode } from '@/lib/file-tree'
import { DebugPanel, ExtensionsPanel, DatabasePanel, APIPanel } from './SidebarPanels'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const sidebarTabs = [
  { id: 'files', icon: 'ph-fill ph-files', label: 'Files' },
  { id: 'search', icon: 'ph-fill ph-magnifying-glass', label: 'Search' },
  { id: 'git', icon: 'ph-fill ph-git-branch', label: 'Git' },
  { id: 'debug', icon: 'ph-fill ph-bug', label: 'Debug' },
  { id: 'extensions', icon: 'ph-fill ph-package', label: 'Extensions' },
  { id: 'docker', icon: 'ph-fill ph-container', label: 'Docker' },
  { id: 'database', icon: 'ph-fill ph-database', label: 'Database' },
  { id: 'api', icon: 'ph-fill ph-plugs', label: 'API' },
]

export default function Sidebar() {
  const { 
    setAIChatOpen, 
    setView,
    view,
    setGlobalSearch,
    activePanel, 
    setActivePanel,
    tabs,
    activeTab,
    gitBranch,
    gitStatus,
    uncommittedChanges,
    fileTree,
    createFile,
    createFolder,
    refreshFileTree
  } = useIDEStore()
  
  const [creatingFile, setCreatingFile] = useState<{ parentId?: string; type: 'file' | 'folder' } | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileTreeNode } | null>(null)
  const [renamingNode, setRenamingNode] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const fileManager = FileTreeManager.getInstance()
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDirectory = (nodeId: string) => {
    fileManager.toggleDirectory(nodeId)
    refreshFileTree()
  }

  const openFile = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      toggleDirectory(node.id)
      return
    }

    const existingTab = tabs.find(tab => tab.path === node.path)
    if (existingTab) {
      return
    }

    const content = getFileContent(node.name)
    const language = getLanguage(node.name)
    
    const { addTab } = useIDEStore.getState()
    addTab({
      id: node.id,
      name: node.name,
      path: node.path,
      content,
      language,
      isDirty: false,
      icon: fileManager.getFileIcon(node.name)
    })
  }

  const handleCreateItem = () => {
    if (!newItemName.trim()) return
    
    if (creatingFile?.type === 'file') {
      createFile(creatingFile.parentId || null, newItemName)
    } else {
      createFolder(creatingFile.parentId || null, newItemName)
    }
    
    setCreatingFile(null)
    setNewItemName('')
  }

  const handleCancelCreate = () => {
    setCreatingFile(null)
    setNewItemName('')
  }

  const handleRightClick = (e: React.MouseEvent, node: FileTreeNode) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  const handleRename = (node: FileTreeNode) => {
    setRenamingNode(node.id)
    setRenameValue(node.name)
    setContextMenu(null)
  }

  const handleRenameSubmit = () => {
    if (!renameValue.trim() || !renamingNode) return
    console.log(`Renamed to: ${renameValue}`)
    setRenamingNode(null)
    setRenameValue('')
  }

  const handleDelete = (node: FileTreeNode) => {
    if (confirm(`Delete ${node.name}?`)) {
      console.log(`Deleted: ${node.name}`)
    }
    setContextMenu(null)
  }

  const handleCopyPath = (node: FileTreeNode) => {
    navigator.clipboard.writeText(node.path)
    console.log(`Copied path: ${node.path}`)
    setContextMenu(null)
  }

  const handleNewFile = (parentNode?: FileTreeNode) => {
    setCreatingFile({ parentId: parentNode?.id, type: 'file' })
    setContextMenu(null)
  }

  const handleNewFolder = (parentNode?: FileTreeNode) => {
    setCreatingFile({ parentId: parentNode?.id, type: 'folder' })
    setContextMenu(null)
  }

  const getFileContent = (filename: string): string => {
    const contentMap: Record<string, string> = {
      'MainEditor.tsx': `'use client'

import { useEffect, useRef } from 'react'
import { useIDEStore } from '@/stores/ide-store'

export default function MainEditor() {
  // Monaco Editor implementation
  return <div>Editor</div>
}`,
      'layout.tsx': `import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kriya IDE'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      'package.json': `{
  "name": "kriya-ide",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`,
      'README.md': `# Kriya IDE

A modern, enterprise-level IDE built with Next.js and React.

## Features

- Monaco Editor
- File Management
- Terminal Integration
- Git Integration`
    }
    return contentMap[filename] || `// ${filename}

// File content here...`
  }

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      'tsx': 'typescript',
      'ts': 'typescript', 
      'js': 'javascript',
      'jsx': 'javascript',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    }
    return langMap[ext || ''] || 'plaintext'
  }

  const renderFileTree = (node: FileTreeNode, depth = 0): React.ReactNode => {
    const isActive = activeTab === node.id
    const paddingLeft = depth * 12 + 12
    const isRenaming = renamingNode === node.id

    return (
      <div key={node.id}>
        <div 
          onClick={() => !isRenaming && openFile(node)}
          onContextMenu={(e) => handleRightClick(e, node)}
          className={`flex items-center gap-2 px-3 py-1 text-xs cursor-pointer transition group ${
            isActive ? 'text-white bg-white/10' : 'text-zinc-600 hover:text-white hover:bg-white/5'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {node.type === 'directory' && (
            <i className={`ph-fill ${node.isExpanded ? 'ph-caret-down' : 'ph-caret-right'} text-[8px]`}></i>
          )}
          <i className={`${
            node.type === 'directory' 
              ? 'ph-fill ph-folder' 
              : fileManager.getFileIcon(node.name)
          } text-sm`}></i>
          
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') { setRenamingNode(null); setRenameValue('') }
              }}
              onBlur={handleRenameSubmit}
              className="flex-1 bg-transparent border border-zinc-600 text-white text-xs outline-none px-1 rounded"
              autoFocus
            />
          ) : (
            <span className="flex-1">{node.name}</span>
          )}
          
          {!isRenaming && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
              {node.type === 'directory' && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNewFile(node) }}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-700 transition"
                    title="New File"
                  >
                    <i className="ph ph-file-plus text-[10px] text-zinc-400"></i>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNewFolder(node) }}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-700 transition"
                    title="New Folder"
                  >
                    <i className="ph ph-folder-plus text-[10px] text-zinc-400"></i>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {node.type === 'directory' && node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileTree(child, depth + 1))}
            {creatingFile?.parentId === node.id && (
              <div 
                className="flex items-center gap-2 px-3 py-1 text-xs"
                style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
              >
                <i className={`${
                  creatingFile.type === 'folder' ? 'ph-fill ph-folder' : 'ph ph-file'
                } text-sm text-zinc-500`}></i>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateItem()
                    if (e.key === 'Escape') handleCancelCreate()
                  }}
                  onBlur={handleCancelCreate}
                  className="flex-1 bg-transparent border-b border-zinc-600 text-white text-xs outline-none"
                  placeholder={`${creatingFile.type} name`}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
        
        {creatingFile?.parentId === undefined && node === fileTree && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs" style={{ paddingLeft: '12px' }}>
            <i className={`${
              creatingFile?.type === 'folder' ? 'ph-fill ph-folder' : 'ph ph-file'
            } text-sm text-zinc-500`}></i>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateItem()
                if (e.key === 'Escape') handleCancelCreate()
              }}
              onBlur={handleCancelCreate}
              className="flex-1 bg-transparent border-b border-zinc-600 text-white text-xs outline-none"
              placeholder={`${creatingFile?.type} name`}
              autoFocus
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Icon Sidebar */}
      <aside className="w-12 border-r-line bg-black flex flex-col items-center py-4 gap-5 shrink-0">
        {sidebarTabs.map(tab => (
          <i 
            key={tab.id}
            onClick={() => setActivePanel(tab.id)} 
            className={`${tab.icon} text-lg cursor-pointer transition ${
              activePanel === tab.id ? 'icon-active' : 'text-zinc-700 hover:text-white'
            }`}
          ></i>
        ))}
        <i 
          onClick={() => setAIChatOpen(true)} 
          className="ph-fill ph-sparkle text-lg text-zinc-700 hover:text-white cursor-pointer transition"
        ></i>
        
        <div className="mt-auto flex flex-col gap-5 items-center">
          <i 
            onClick={() => setView('settings')} 
            className={`ph-fill ph-gear-six text-lg cursor-pointer transition ${
              view === 'settings' ? 'icon-active' : 'text-zinc-700 hover:text-white'
            }`}
          ></i>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-700 to-white border-line cursor-pointer overflow-hidden">
            <Image 
              src="https://api.dicebear.com/9.x/glass/svg?seed=kriya-user" 
              alt="User Avatar"
              width={28}
              height={28}
              className="w-full h-full"
            />
          </div>
        </div>
      </aside>

      {/* Content Sidebar */}
      {activePanel && (
        <aside className="w-64 border-r-line bg-black shrink-0 flex flex-col overflow-hidden">
          
          {/* Files Panel */}
          {activePanel === 'files' && (
            <div className="flex flex-col h-full">
              <div className="h-10 px-4 flex items-center justify-between shrink-0">
                <span className="label">Files</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCreatingFile({ type: 'file' })}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors"
                    title="New File (Ctrl+N)"
                  >
                    <i className="ph ph-file-plus text-white text-xs"></i>
                  </button>
                  <button 
                    onClick={() => setCreatingFile({ type: 'folder' })}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors"
                    title="New Folder"
                  >
                    <i className="ph ph-folder-plus text-white text-xs"></i>
                  </button>
                  <button 
                    onClick={() => refreshFileTree()}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors"
                    title="Refresh"
                  >
                    <i className="ph ph-arrow-clockwise text-white text-xs"></i>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {fileTree && renderFileTree(fileTree)}
              </div>
            </div>
          )}

          {/* Git Panel */}
          {activePanel === 'git' && (
            <div className="flex flex-col h-full">
              <div className="h-10 px-4 flex items-center justify-between shrink-0">
                <span className="label">Source Control</span>
                <div className="flex gap-2">
                  <i className="ph ph-git-commit text-zinc-600 hover:text-white cursor-pointer text-xs transition"></i>
                  <i className="ph ph-git-pull-request text-zinc-600 hover:text-white cursor-pointer text-xs transition"></i>
                </div>
              </div>
              <div className="p-3 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Branch:</span>
                    <span className="text-white font-mono">{gitBranch}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Status:</span>
                    <span className={`font-semibold ${
                      gitStatus === 'clean' ? 'text-green-400' :
                      gitStatus === 'modified' ? 'text-yellow-400' :
                      gitStatus === 'staged' ? 'text-blue-400' :
                      'text-green-400'
                    }`}>
                      {gitStatus.charAt(0).toUpperCase() + gitStatus.slice(1)}
                    </span>
                  </div>
                  {uncommittedChanges > 0 && (
                    <div className="text-xs text-zinc-400">
                      {uncommittedChanges} uncommitted change{uncommittedChanges !== 1 ? 's' : ''}
                    </div>
                  )}
                  <button className="w-full btn-primary text-xs py-2">
                    Commit Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Panel */}
          {activePanel === 'search' && (
            <div className="flex flex-col h-full">
              <div className="h-10 px-4 flex items-center">
                <span className="label">Search</span>
              </div>
              <div className="p-3 flex-1">
                <button 
                  onClick={() => setGlobalSearch(true)}
                  className="w-full p-3 text-left text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg border-line transition"
                >
                  <i className="ph ph-magnifying-glass mr-2"></i>
                  Search across files...
                </button>
              </div>
            </div>
          )}

          {/* Debug Panel */}
          {activePanel === 'debug' && <DebugPanel />}

          {/* Extensions Panel */}
          {activePanel === 'extensions' && <ExtensionsPanel />}

          {/* Database Panel */}
          {activePanel === 'database' && <DatabasePanel />}

          {/* API Panel */}
          {activePanel === 'api' && <APIPanel />}

          {/* Docker Panel */}
          {activePanel === 'docker' && (
            <div className="flex flex-col h-full">
              <div className="h-10 px-4 flex items-center">
                <span className="label">Docker</span>
              </div>
              <div className="p-3 flex-1">
                <div className="text-xs text-zinc-600">Docker containers and images...</div>
              </div>
            </div>
          )}

          {/* Other panels */}
          {!['files', 'git', 'search', 'debug', 'extensions', 'database', 'api', 'docker'].includes(activePanel) && (
            <div className="flex flex-col h-full">
              <div className="h-10 px-4 flex items-center">
                <span className="label">{sidebarTabs.find(t => t.id === activePanel)?.label}</span>
              </div>
              <div className="p-3 flex-1">
                <div className="text-xs text-zinc-600">Panel content...</div>
              </div>
            </div>
          )}

        </aside>
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.node.type === 'directory' && (
            <>
              <button
                onClick={() => handleNewFile(contextMenu.node)}
                className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition flex items-center gap-2"
              >
                <i className="ph ph-file-plus text-xs"></i>
                New File
              </button>
              <button
                onClick={() => handleNewFolder(contextMenu.node)}
                className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition flex items-center gap-2"
              >
                <i className="ph ph-folder-plus text-xs"></i>
                New Folder
              </button>
              <div className="h-px bg-zinc-700 my-1"></div>
            </>
          )}
          
          <button
            onClick={() => handleRename(contextMenu.node)}
            className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition flex items-center gap-2"
          >
            <i className="ph ph-pencil text-xs"></i>
            Rename
          </button>
          
          <button
            onClick={() => handleCopyPath(contextMenu.node)}
            className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition flex items-center gap-2"
          >
            <i className="ph ph-copy text-xs"></i>
            Copy Path
          </button>
          
          {contextMenu.node.type === 'file' && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.node.path.split('/').pop() || '')
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition flex items-center gap-2"
            >
              <i className="ph ph-clipboard text-xs"></i>
              Copy Name
            </button>
          )}
          
          <div className="h-px bg-zinc-700 my-1"></div>
          
          <button
            onClick={() => handleDelete(contextMenu.node)}
            className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-900/20 transition flex items-center gap-2"
          >
            <i className="ph ph-trash text-xs"></i>
            Delete
          </button>
        </div>
      )}
    </>
  )
}