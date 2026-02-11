'use client'

import { useIDEStore } from '@/stores/ide-store-fast'
import { FileTreeManager, FileTreeNode } from '@/lib/file-tree'
import { DebugPanel, ExtensionsPanel, DatabasePanel, APIPanel } from './SidebarPanels'
import { useState, useEffect, useRef, useCallback } from 'react'
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
    closeTab
  } = useIDEStore()
  
    // Generate sample content based on file type
    const getFileContent = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase()
      const componentName = filename.replace(/\.(tsx|jsx)$/, '').replace(/[^a-zA-Z0-9]/g, '')
      const contentMap: Record<string, string> = {
        'tsx': `'use client'\n\nimport { useState } from 'react'\n\nexport default function ${componentName}() {\n  return (\n    <div>\n      <h1>${componentName}</h1>\n    </div>\n  )\n}`,
        'jsx': `'use client'\n\nimport { useState } from 'react'\n\nexport default function ${componentName}() {\n  return (\n    <div>\n      <h1>${componentName}</h1>\n    </div>\n  )\n}`,
        'ts': `// ${filename}\n\nexport const example = () => {\n  console.log('Hello from ${filename}')\n}`,
        'js': `// ${filename}\n\nfunction example() {\n  console.log('Hello from ${filename}')\n}\n\nexport default example`,
        'css': `/* ${filename} */\n\n.container {\n  padding: 20px;\n  margin: 0 auto;\n}`,
        'json': `{\n  "name": "example",\n  "version": "1.0.0"\n}`,
        'md': `# ${filename.replace('.md', '')}\n\nContent here...`,
        'html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${filename.replace('.html', '')}</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`,
        'py': `# ${filename}\n\ndef main():\n    print("Hello from ${filename}")\n\nif __name__ == "__main__":\n    main()`
      }
      return contentMap[ext || ''] || `// ${filename}\n\n`
    }

    const getLanguage = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase()
      const langMap: Record<string, string> = {
        'tsx': 'typescript', 'ts': 'typescript', 'js': 'javascript', 'jsx': 'javascript',
        'css': 'css', 'json': 'json', 'md': 'markdown'
      }
      return langMap[ext || ''] || 'plaintext'
    }
  const [files, setFiles] = useState<FileTreeNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [creatingFile, setCreatingFile] = useState<{ parentId?: string; type: 'file' | 'directory' } | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileTreeNode } | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [renamingNode, setRenamingNode] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const fileTreeManager = FileTreeManager.getInstance()
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFiles()
    
    // Check screen size and set responsive behavior
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarWidth(280)
        setSidebarCollapsed(true)
      } else {
        setSidebarWidth(320)
        setSidebarCollapsed(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    // Force refresh file tree on mount
    const timer = setTimeout(() => {
      loadFiles()
    }, 100)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      clearTimeout(timer)
    }
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return // Disable resize on mobile
    setIsResizing(true)
    e.preventDefault()
  }, [isMobile])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || isMobile) return
    
    const newWidth = e.clientX - 48 // 48px is the width of the icon sidebar
    const minWidth = isMobile ? 250 : 200
    const maxWidth = isMobile ? 350 : 600
    
    setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
  }, [isResizing, isMobile])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const loadFiles = () => {
    const tree = fileTreeManager.getFileTree()
    if (tree && tree.children) {
      setFiles(tree.children)
    }
  }

  const toggleDirectory = (id: string) => {
    fileTreeManager.toggleDirectory(id)
    loadFiles()
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedDirs(newExpanded)
  }

  const openFile = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      setSelectedFolder(node.id)
      toggleDirectory(node.id)
      return
    }

    console.log('Opening file:', node)
    const existingTab = tabs.find(tab => tab.path === node.path)
    if (existingTab) {
      console.log('File already open, switching to tab:', existingTab.id)
      const { setActiveTab } = useIDEStore.getState()
      setActiveTab(existingTab.id)
      return
    }

    const fileTab = {
      id: node.id,
      name: node.name,
      path: node.path,
      content: getFileContent(node.name),
      language: getLanguage(node.name),
      isDirty: false,
      icon: fileTreeManager.getFileIcon(node.name)
    }
    
    console.log('Adding new tab:', fileTab)
    addTab(fileTab)
  }

  const handleCreateFile = (fileName: string) => {
    if (!creatingFile || !fileName.trim()) return
    
    const newFile = fileTreeManager.addFile(creatingFile.parentId || null, fileName)
    if (newFile) {
      loadFiles()
      // Auto-open the new file
      openFile(newFile)
    }
    setCreatingFile(null)
    setNewItemName('')
  }

  const handleCreateFolder = (folderName: string) => {
    if (!creatingFile || !folderName.trim()) return
    
    fileTreeManager.addFolder(creatingFile.parentId || null, folderName)
    loadFiles()
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
    // Rename not fully implemented in file tree manager
    setRenamingNode(null)
    setRenameValue('')
  }

  const handleDelete = (node: FileTreeNode) => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      const { closeTab } = useIDEStore.getState()
      
      if (node.type === 'file') {
        closeTab(node.id)
      } else if (node.type === 'directory' && node.children) {
        const closeAllInDirectory = (dirNode: FileTreeNode) => {
          if (dirNode.children) {
            dirNode.children.forEach(child => {
              if (child.type === 'file') {
                closeTab(child.id)
              } else if (child.type === 'directory') {
                closeAllInDirectory(child)
              }
            })
          }
        }
        closeAllInDirectory(node)
      }
      
      fileTreeManager.deleteNode(node.id)
      loadFiles()
    }
    setContextMenu(null)
  }

  const handleCopyPath = (node: FileTreeNode) => {
    navigator.clipboard.writeText(node.path)
    setContextMenu(null)
  }

  const handleNewFile = () => {
    setCreatingFile({ parentId: selectedFolder || undefined, type: 'file' })
    setContextMenu(null)
  }

  const handleNewFolder = () => {
    setCreatingFile({ parentId: selectedFolder || undefined, type: 'directory' })
    setContextMenu(null)
  }

  const handleNewFileInFolder = (parentNode: FileTreeNode) => {
    setCreatingFile({ parentId: parentNode.id, type: 'file' })
    setContextMenu(null)
  }

  const handleNewFolderInFolder = (parentNode: FileTreeNode) => {
    setCreatingFile({ parentId: parentNode.id, type: 'directory' })
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
  }

  const createNewYamlFile = () => {
    const newFile = {
      id: `yaml-${Date.now()}`,
      name: 'new-config.yml',
      path: '/new-config.yml',
      content: '# New YAML configuration\nname: example\nversion: 1.0',
      isValid: true
    }
    openYamlFile(newFile)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const yamlFile = {
          id: `yaml-${Date.now()}`,
          name: file.name,
          path: `/${file.name}`,
          content,
          isValid: true
        }
        openYamlFile(yamlFile)
      }
      reader.readAsText(file)
    }
    event.target.value = ''
  }

  const renderFileTree = (nodes: FileTreeNode[], depth = 0, parentLines: boolean[] = []): React.ReactNode => {
    return nodes.map((node, index) => {
      const isLast = index === nodes.length - 1
      const isActive = tabs.some(tab => tab.path === node.path && tab.id === activeTab)
      const isRenaming = renamingNode === node.id
      const isExpanded = node.isExpanded || expandedDirs.has(node.id)
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
                  <i className={`ph-fill ${isExpanded ? 'ph-caret-down' : 'ph-caret-right'} text-[10px] text-zinc-400`}></i>
                </div>
              )}
              
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${
                  node.type === 'directory' 
                    ? selectedFolder === node.id ? 'ph-fill ph-folder-open' : 'ph-fill ph-folder'
                    : fileTreeManager.getFileIcon(node.name)
                } text-sm`} style={node.type === 'directory' ? { color: selectedFolder === node.id ? '#10B981' : '#059669' } : {}}></i>
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
              
              {creatingFile?.parentId === node.id && (
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
            onClick={() => {
              if (isMobile && activePanel === tab.id) {
                setActivePanel('')
              } else {
                setActivePanel(tab.id)
              }
            }} 
            className={`${tab.icon} text-lg cursor-pointer transition ${
              activePanel === tab.id ? 'icon-active' : 'text-zinc-700 hover:text-white'
            }`}
            title={tab.label}
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
        <>
          {/* Mobile Overlay */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setActivePanel('')}
            />
          )}
          
          <aside 
            ref={sidebarRef}
            className={`border-r-line bg-black shrink-0 flex flex-col overflow-hidden relative transition-transform duration-200 ${
              isMobile ? 'fixed left-12 top-0 h-full z-50 shadow-2xl' : ''
            }`}
            style={{ 
              width: `${sidebarWidth}px`,
              transform: isMobile && !activePanel ? 'translateX(-100%)' : 'translateX(0)'
            }}
          >
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
                {creatingFile?.parentId === undefined && (
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
                    onClick={() => {
                      const newFile = {
                        id: `yaml-${Date.now()}`,
                        name: 'new-config.yml',
                        path: '/new-config.yml',
                        content: '# New YAML configuration\nname: example\nversion: 1.0',
                        language: 'yaml',
                        isDirty: false,
                        icon: 'ph-fill ph-file-text'
                      }
                      addTab(newFile)
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors group"
                    title="New YAML File"
                  >
                    <i className="ph ph-file-plus text-zinc-400 group-hover:text-blue-400 text-sm transition-colors"></i>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="text-center text-zinc-500 text-sm py-8">
                  <i className="ph ph-file-text text-2xl mb-2 block"></i>
                  No YAML files
                </div>
              </div>
            </div>
          )}
          
          {/* Resize Handle - Desktop Only */}
          {!isMobile && (
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors group"
              onMouseDown={handleMouseDown}
            >
              <div className="w-full h-full group-hover:bg-blue-500/20" />
            </div>
          )}
        </aside>
        </>
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