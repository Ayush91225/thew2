'use client'

import { useIDEStore } from '@/stores/ide-store'
import { FileTreeManager, FileTreeNode } from '@/lib/file-tree'
import { DebugPanel, ExtensionsPanel, DatabasePanel, APIPanel } from './SidebarPanels'
import CollaborationToggle from './CollaborationToggle'
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
  { id: 'yaml', icon: 'ph-fill ph-file-text', label: 'YAML' },
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
    addTab,
    gitBranch,
    gitStatus,
    uncommittedChanges,
    fileTree,
    createFile,
    createFolder,
    refreshFileTree,
    yamlFiles,
    activeYamlFile,
    addYamlFile,
    deleteYamlFile,
    setActiveYamlFile,
    validateYaml,
    runYaml,
    uploadYamlFile,
    setYamlModal
  } = useIDEStore()
  
  const [creatingFile, setCreatingFile] = useState<{ parentId?: string; type: 'file' | 'folder' } | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileTreeNode } | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
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

  const getCurrentFolder = (): string | null => {
    if (!activeTab) return null
    const activeTabData = tabs.find(tab => tab.id === activeTab)
    if (!activeTabData) return null
    const pathParts = activeTabData.path.split('/')
    pathParts.pop()
    return pathParts.join('/') || null
  }

  const findNodeByPath = (node: FileTreeNode, path: string): FileTreeNode | null => {
    if (node.path === path) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeByPath(child, path)
        if (found) return found
      }
    }
    return null
  }

  const toggleDirectory = (nodeId: string) => {
    fileManager.toggleDirectory(nodeId)
    refreshFileTree()
  }

  const openFile = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      setSelectedFolder(node.id)
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

  const handleCreateFile = (fileName: string) => {
    if (!creatingFile) return
    createFile(creatingFile.parentId || null, fileName)
    setCreatingFile(null)
    setNewItemName('')
  }

  const handleCreateFolder = (folderName: string) => {
    if (!creatingFile) return
    createFolder(creatingFile.parentId || null, folderName)
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

  const handleNewFile = () => {
    setCreatingFile({ parentId: selectedFolder || undefined, type: 'file' })
    setContextMenu(null)
  }

  const handleNewFolder = () => {
    setCreatingFile({ parentId: selectedFolder || undefined, type: 'folder' })
    setContextMenu(null)
  }

  const handleNewFileInFolder = (parentNode: FileTreeNode) => {
    setCreatingFile({ parentId: parentNode.id, type: 'file' })
    setContextMenu(null)
  }

  const handleNewFolderInFolder = (parentNode: FileTreeNode) => {
    setCreatingFile({ parentId: parentNode.id, type: 'folder' })
    setContextMenu(null)
  }

  const openYamlFile = (yamlFile: any) => {
    const existingTab = tabs.find(tab => tab.path === yamlFile.path)
    if (existingTab) {
      return
    }

    addTab({
      id: yamlFile.id,
      name: yamlFile.name,
      path: yamlFile.path,
      content: yamlFile.content,
      language: 'yaml',
      isDirty: false,
      icon: 'ph-fill ph-file-text'
    })
    setActiveYamlFile(yamlFile.id)
  }

  const createNewYamlFile = () => {
    const newFile = {
      id: `yaml-${Date.now()}`,
      name: 'new-config.yml',
      path: '/new-config.yml',
      content: '# New YAML configuration\nname: example\nversion: 1.0',
      isValid: true
    }
    addYamlFile(newFile)
    openYamlFile(newFile)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const isYamlFile = file.name.toLowerCase().endsWith('.yml') || file.name.toLowerCase().endsWith('.yaml')
      const isYamlMimeType = file.type === 'application/x-yaml' || file.type === 'text/yaml' || file.type === 'text/x-yaml'
      
      if (isYamlFile || isYamlMimeType) {
        uploadYamlFile(file)
      } else {
        alert('Please upload only YAML files (.yml or .yaml)')
      }
    }
    event.target.value = ''
  }

  const getFileContent = (filename: string): string => {
    const contentMap: Record<string, string> = {
      'MainEditor.tsx': `'use client'

import { useEffect, useRef } from 'react'
import { useIDEStore } from '@/stores/ide-store'

export default function MainEditor() {
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

  const renderFileTree = (node: FileTreeNode, depth = 0, isLast = false, parentLines: boolean[] = []): React.ReactNode => {
    const isActive = activeTab === node.id
    const isRenaming = renamingNode === node.id
    const indent = depth * 16

    return (
      <div key={node.id}>
        <div 
          onClick={() => !isRenaming && openFile(node)}
          onContextMenu={(e) => handleRightClick(e, node)}
          className={`relative flex items-center h-6 text-xs cursor-pointer select-none ${
            isActive ? 'bg-blue-600/20 text-white' : 
            selectedFolder === node.id ? 'bg-amber-600/20 text-amber-200' :
            'text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          {/* Tree lines */}
          {parentLines.map((hasLine, i) => (
            hasLine && (
              <div
                key={i}
                className="absolute w-px h-full bg-zinc-600/40"
                style={{ left: `${8 + i * 16}px` }}
              />
            )
          ))}
          
          {/* Current level connector */}
          {depth > 0 && (
            <>
              <div
                className="absolute w-px bg-zinc-600/40"
                style={{ 
                  left: `${8 + (depth - 1) * 16}px`,
                  top: 0,
                  height: isLast ? '12px' : '100%'
                }}
              />
              <div
                className="absolute h-px bg-zinc-600/40"
                style={{ 
                  left: `${8 + (depth - 1) * 16}px`,
                  top: '12px',
                  width: '8px'
                }}
              />
            </>
          )}
          
          <div className="flex items-center gap-1" style={{ paddingLeft: `${indent + 4}px` }}>
            {node.type === 'directory' && (
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`ph-fill ${node.isExpanded ? 'ph-caret-down' : 'ph-caret-right'} text-[10px] text-zinc-400`}></i>
              </div>
            )}
            
            <div className="w-4 h-4 flex items-center justify-center">
              <i className={`${
                node.type === 'directory' 
                  ? selectedFolder === node.id ? 'ph-fill ph-folder-open' : 'ph-fill ph-folder'
                  : fileManager.getFileIcon(node.name)
              } text-sm`} style={node.type === 'directory' ? { color: selectedFolder === node.id ? '#FCD34D' : '#FFB800' } : {}}></i>
            </div>
            
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
                className="bg-zinc-800 border border-zinc-600 text-white text-xs outline-none px-1 py-0 rounded"
                autoFocus
              />
            ) : (
              <span className="text-xs truncate">{node.name}</span>
            )}
          </div>
        </div>
        
        {node.type === 'directory' && node.isExpanded && node.children && (
          <div>
            {node.children.map((child, index) => {
              const isChildLast = index === node.children!.length - 1
              const newParentLines = [...parentLines]
              if (depth >= 0) {
                newParentLines[depth] = !isLast
              }
              return renderFileTree(child, depth + 1, isChildLast, newParentLines)
            })}
            
            {creatingFile?.parentId === node.id && (
              <div className="relative flex items-center h-6 text-xs">
                {/* Tree lines for new item */}
                {parentLines.map((hasLine, i) => (
                  hasLine && (
                    <div
                      key={i}
                      className="absolute w-px h-full bg-zinc-600/40"
                      style={{ left: `${8 + i * 16}px` }}
                    />
                  )
                ))}
                
                <div
                  className="absolute w-px h-3 bg-zinc-600/40"
                  style={{ left: `${8 + depth * 16}px`, top: 0 }}
                />
                <div
                  className="absolute h-px w-2 bg-zinc-600/40"
                  style={{ left: `${8 + depth * 16}px`, top: '12px' }}
                />
                
                <div className="flex items-center gap-1" style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`${
                      creatingFile.type === 'folder' ? 'ph-fill ph-folder' : 'ph ph-file'
                    } text-sm text-zinc-500`}></i>
                  </div>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newItemName.trim()) {
                        if (creatingFile.type === 'file') handleCreateFile(newItemName)
                        else handleCreateFolder(newItemName)
                      }
                      if (e.key === 'Escape') handleCancelCreate()
                    }}
                    onBlur={handleCancelCreate}
                    className="bg-zinc-800 border border-zinc-600 text-white text-xs outline-none px-1 py-0 rounded flex-1"
                    placeholder={creatingFile.type === 'file' ? 'filename.ext' : ''}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {creatingFile?.parentId === undefined && node === fileTree && (
          <div className="flex items-center h-6 text-xs">
            <div className="flex items-center gap-1 pl-1">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${
                  creatingFile?.type === 'folder' ? 'ph-fill ph-folder' : 'ph ph-file'
                } text-sm text-zinc-500`}></i>
              </div>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemName.trim()) {
                    if (creatingFile?.type === 'file') handleCreateFile(newItemName)
                    else handleCreateFolder(newItemName)
                  }
                  if (e.key === 'Escape') handleCancelCreate()
                }}
                onBlur={handleCancelCreate}
                className="bg-zinc-800 border border-zinc-600 text-white text-xs outline-none px-1 py-0 rounded flex-1"
                placeholder={creatingFile?.type === 'file' ? 'filename.ext' : ''}
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
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
          <CollaborationToggle />
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
              unoptimized
            />
          </div>
        </div>
      </aside>

      {activePanel && (
        <aside className="w-64 border-r-line bg-black shrink-0 flex flex-col overflow-hidden">
          {activePanel === 'files' && (
            <div className="flex flex-col h-full">
              <div className="h-11 px-4 flex items-center justify-between shrink-0 border-b border-zinc-800/50">
                <span className="text-white text-sm font-medium">Explorer</span>
                <div className="flex gap-1">
                  <button 
                    onClick={handleNewFile}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors group"
                    title="New File"
                  >
                    <i className="ph ph-file-plus text-zinc-400 group-hover:text-blue-400 text-sm transition-colors"></i>
                  </button>
                  <button 
                    onClick={handleNewFolder}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors group"
                    title="New Folder"
                  >
                    <i className="ph ph-folder-plus text-zinc-400 group-hover:text-amber-400 text-sm transition-colors"></i>
                  </button>
                  <button 
                    onClick={() => refreshFileTree()}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors group"
                    title="Refresh"
                  >
                    <i className="ph ph-arrow-clockwise text-zinc-400 group-hover:text-white text-sm transition-colors"></i>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {fileTree && renderFileTree(fileTree)}
              </div>
            </div>
          )}

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

          {activePanel === 'debug' && <DebugPanel />}
          {activePanel === 'extensions' && <ExtensionsPanel />}
          {activePanel === 'database' && <DatabasePanel />}
          {activePanel === 'api' && <APIPanel />}
        </aside>
      )}
      
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-zinc-900/95 backdrop-blur border border-zinc-700/50 rounded-xl shadow-2xl z-50 py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleNewFileInFolder(contextMenu.node)}
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-all flex items-center gap-3 rounded-lg mx-1"
          >
            <i className="ph ph-file-plus text-blue-400 text-sm"></i>
            New File
          </button>
          <button
            onClick={() => handleNewFolderInFolder(contextMenu.node)}
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-all flex items-center gap-3 rounded-lg mx-1"
          >
            <i className="ph ph-folder-plus text-amber-400 text-sm"></i>
            New Folder
          </button>
          <div className="h-px bg-zinc-700/50 my-2 mx-2"></div>
          
          <button
            onClick={() => handleRename(contextMenu.node)}
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-all flex items-center gap-3 rounded-lg mx-1"
          >
            <i className="ph ph-pencil text-zinc-400 text-sm"></i>
            Rename
          </button>
          
          <button
            onClick={() => handleCopyPath(contextMenu.node)}
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-all flex items-center gap-3 rounded-lg mx-1"
          >
            <i className="ph ph-copy text-zinc-400 text-sm"></i>
            Copy Path
          </button>
          
          <div className="h-px bg-zinc-700/50 my-2 mx-2"></div>
          
          <button
            onClick={() => handleDelete(contextMenu.node)}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all flex items-center gap-3 rounded-lg mx-1"
          >
            <i className="ph ph-trash text-sm"></i>
            Delete
          </button>
        </div>
      )}
    </>
  )
}