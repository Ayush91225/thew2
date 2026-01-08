'use client'

import { useIDEStore } from '@/stores/ide-store'
import { APIFileSystem, FileNode } from '@/lib/api-file-system'
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
  
  const get = useIDEStore.getState
  const [files, setFiles] = useState<FileNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [creatingFile, setCreatingFile] = useState<{ parentPath?: string; type: 'file' | 'directory' } | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [renamingNode, setRenamingNode] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const fileSystem = APIFileSystem.getInstance()
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadFiles = async () => {
    try {
      const fileList = await fileSystem.listFiles()
      setFiles(fileList)
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedDirs(newExpanded)
  }

  const openFile = async (node: FileNode) => {
    if (node.type === 'directory') {
      setSelectedFolder(node.path)
      toggleDirectory(node.path)
      return
    }

    const existingTab = tabs.find(tab => tab.path === node.path)
    if (existingTab) {
      return
    }

    try {
      const content = await fileSystem.readFile(node.path)
      const language = fileSystem.getLanguageFromExtension(node.name)
      
      addTab({
        id: `file-${Date.now()}`,
        name: node.name,
        path: node.path,
        content,
        language,
        isDirty: false,
        icon: fileSystem.getFileIcon(node.name)
      })
    } catch (error) {
      console.error('Failed to open file:', error)
    }
  }

  const handleCreateFile = async (fileName: string) => {
    if (!creatingFile || !fileName.trim()) return
    
    try {
      await fileSystem.createFile(creatingFile.parentPath || '', fileName)
      await loadFiles()
      setCreatingFile(null)
      setNewItemName('')
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    if (!creatingFile || !folderName.trim()) return
    
    try {
      await fileSystem.createDirectory(creatingFile.parentPath || '', folderName)
      await loadFiles()
      setCreatingFile(null)
      setNewItemName('')
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const handleCancelCreate = () => {
    setCreatingFile(null)
    setNewItemName('')
  }

  const handleRightClick = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  const handleRename = (node: FileNode) => {
    setRenamingNode(node.path)
    setRenameValue(node.name)
    setContextMenu(null)
  }

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || !renamingNode) return
    
    try {
      const oldPath = renamingNode
      const pathParts = oldPath.split('/')
      pathParts[pathParts.length - 1] = renameValue
      const newPath = pathParts.join('/')
      
      await fileSystem.renameFile(oldPath, newPath)
      await loadFiles()
      setRenamingNode(null)
      setRenameValue('')
    } catch (error) {
      console.error('Failed to rename:', error)
    }
  }

  const handleDelete = async (node: FileNode) => {
    if (confirm(`Delete ${node.name}?`)) {
      try {
        await fileSystem.deleteFile(node.path)
        await loadFiles()
        
        // Close any open tabs for the deleted file
        const { tabs, closeTab } = useIDEStore.getState()
        const tabToClose = tabs.find(tab => tab.path === node.path)
        if (tabToClose) {
          closeTab(tabToClose.id)
        }
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
    setContextMenu(null)
  }

  const handleCopyPath = (node: FileNode) => {
    navigator.clipboard.writeText(node.path)
    setContextMenu(null)
  }

  const handleNewFile = () => {
    setCreatingFile({ parentPath: selectedFolder || undefined, type: 'file' })
    setContextMenu(null)
  }

  const handleNewFolder = () => {
    setCreatingFile({ parentPath: selectedFolder || undefined, type: 'directory' })
    setContextMenu(null)
  }

  const handleNewFileInFolder = (parentNode: FileNode) => {
    setCreatingFile({ parentPath: parentNode.path, type: 'file' })
    setContextMenu(null)
  }

  const handleNewFolderInFolder = (parentNode: FileNode) => {
    setCreatingFile({ parentPath: parentNode.path, type: 'directory' })
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

  const renderFileTree = (nodes: FileNode[], depth = 0, parentLines: boolean[] = []): React.ReactNode => {
    return nodes.map((node, index) => {
      const isLast = index === nodes.length - 1
      const isActive = tabs.some(tab => tab.path === node.path && tab.id === activeTab)
      const isRenaming = renamingNode === node.path
      const isExpanded = expandedDirs.has(node.path)
      const indent = depth * 16

      return (
        <div key={node.path}>
          <div 
            onClick={() => !isRenaming && openFile(node)}
            onContextMenu={(e) => handleRightClick(e, node)}
            className={`relative flex items-center h-6 text-xs cursor-pointer select-none ${
              isActive ? 'bg-blue-600/20 text-white' : 
              selectedFolder === node.path ? 'bg-amber-600/20 text-amber-200' :
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
                  <i className={`ph-fill ${isExpanded ? 'ph-caret-down' : 'ph-caret-right'} text-[10px] text-zinc-400`}></i>
                </div>
              )}
              
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${
                  node.type === 'directory' 
                    ? selectedFolder === node.path ? 'ph-fill ph-folder-open' : 'ph-fill ph-folder'
                    : fileSystem.getFileIcon(node.name)
                } text-sm`} style={node.type === 'directory' ? { color: selectedFolder === node.path ? '#10B981' : '#059669' } : {}}></i>
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
          
          {node.type === 'directory' && isExpanded && node.children && (
            <div>
              {renderFileTree(node.children, depth + 1, [...parentLines, !isLast])}
              
              {creatingFile?.parentPath === node.path && (
                <div className="relative flex items-center h-6 text-xs">
                  <div className="flex items-center gap-1" style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}>
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className={`${
                        creatingFile.type === 'directory' ? 'ph-fill ph-folder' : 'ph ph-file'
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
                      placeholder={creatingFile.type === 'file' ? 'filename.ext' : 'folder name'}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    })
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
          <i 
            onClick={() => setView(view === 'settings' ? get().previousView : 'settings')} 
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
                    onClick={loadFiles}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors group"
                    title="Refresh"
                  >
                    <i className="ph ph-arrow-clockwise text-zinc-400 group-hover:text-white text-sm transition-colors"></i>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {renderFileTree(files)}
                {creatingFile?.parentPath === undefined && (
                  <div className="flex items-center h-6 text-xs px-1">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className={`${
                          creatingFile?.type === 'directory' ? 'ph-fill ph-folder' : 'ph ph-file'
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
                        placeholder={creatingFile?.type === 'file' ? 'filename.ext' : 'folder name'}
                        autoFocus
                      />
                    </div>
                  </div>
                )}
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
          {activePanel === 'yaml' && (
            <div className="flex flex-col h-full">
              <div className="h-11 px-4 flex items-center justify-between shrink-0 border-b border-zinc-800/50">
                <span className="text-white text-sm font-medium">YAML Files</span>
                <div className="flex gap-1">
                  <button 
                    onClick={createNewYamlFile}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors group"
                    title="New YAML File"
                  >
                    <i className="ph ph-file-plus text-zinc-400 group-hover:text-blue-400 text-sm transition-colors"></i>
                  </button>
                  <label className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors group cursor-pointer" title="Upload YAML File">
                    <i className="ph ph-upload text-zinc-400 group-hover:text-green-400 text-sm transition-colors"></i>
                    <input type="file" accept=".yml,.yaml" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {yamlFiles.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm py-8">
                    <i className="ph ph-file-text text-2xl mb-2 block"></i>
                    No YAML files
                  </div>
                ) : (
                  <div className="space-y-2">
                    {yamlFiles.map((yamlFile) => (
                      <div
                        key={yamlFile.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition group ${
                          activeYamlFile === yamlFile.id ? 'bg-blue-600/20 text-white' : 'text-zinc-300 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div onClick={() => openYamlFile(yamlFile)} className="flex items-center gap-2 flex-1">
                          <i className="ph ph-file-text text-sm"></i>
                          <span className="text-xs truncate flex-1">{yamlFile.name}</span>
                          {yamlFile.isRunning && (
                            <i className="ph ph-spinner text-xs animate-spin text-blue-400"></i>
                          )}
                          {yamlFile.runStatus === 'success' && (
                            <i className="ph ph-check-circle text-xs text-green-400"></i>
                          )}
                          {yamlFile.runStatus === 'error' && (
                            <i className="ph ph-x-circle text-xs text-red-400"></i>
                          )}
                          {!yamlFile.isValid && (
                            <i className="ph ph-warning text-xs text-yellow-400"></i>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              validateYaml(yamlFile.id)
                            }}
                            className="p-1 text-zinc-400 hover:text-blue-400 transition rounded"
                            title="Validate"
                          >
                            <i className="ph ph-check-circle text-xs"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              runYaml(yamlFile.id)
                            }}
                            className="p-1 text-zinc-400 hover:text-green-400 transition rounded"
                            title="Run"
                            disabled={yamlFile.isRunning}
                          >
                            <i className={`ph ${yamlFile.isRunning ? 'ph-spinner animate-spin' : 'ph-play'} text-xs`}></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteYamlFile(yamlFile.id)
                            }}
                            className="p-1 text-zinc-400 hover:text-red-400 transition rounded"
                            title="Delete"
                          >
                            <i className="ph ph-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setYamlModal(true)}
                    className="w-full p-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded transition flex items-center justify-center gap-2"
                  >
                    <i className="ph ph-code"></i>
                    Open YAML Editor
                  </button>
                </div>
              </div>
            </div>
          )}
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