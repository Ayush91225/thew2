'use client'

import { useIDEStore } from '@/stores/ide-store'
import { FileSystemManager } from '@/lib/file-system'
import { useState } from 'react'

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

const projectFiles = [
  { name: 'index.tsx', icon: 'ph-fill ph-file-js', modified: true },
  { name: 'styles.css', icon: 'ph-fill ph-file-css', modified: true },
  { name: 'package.json', icon: 'ph-fill ph-file-text', modified: false },
  { name: 'components/Button.tsx', icon: 'ph-fill ph-file-js', modified: false },
  { name: 'utils/api.ts', icon: 'ph-fill ph-file-js', modified: false },
  { name: 'lib/file-system.ts', icon: 'ph-fill ph-file-ts', modified: false },
  { name: 'components/Terminal.tsx', icon: 'ph-fill ph-file-tsx', modified: false },
  { name: 'components/GlobalSearch.tsx', icon: 'ph-fill ph-file-tsx', modified: false },
]

export default function Sidebar() {
  const { 
    setAIModal, 
    setSettingsModal, 
    setGlobalSearch,
    addTab, 
    activePanel, 
    setActivePanel,
    tabs,
    projectRoot,
    setProjectRoot,
    gitBranch,
    gitStatus,
    uncommittedChanges
  } = useIDEStore()
  
  const [isLoadingProject, setIsLoadingProject] = useState(false)
  const fileManager = FileSystemManager.getInstance()

  const openProject = async () => {
    setIsLoadingProject(true)
    try {
      const projectTree = await fileManager.openProject()
      if (projectTree) {
        setProjectRoot(projectTree.name)
        console.log('Project opened:', projectTree)
      }
    } catch (error) {
      console.error('Failed to open project:', error)
    } finally {
      setIsLoadingProject(false)
    }
  }

  const openFile = (file: any) => {
    const existingTab = tabs.find(tab => tab.name === file.name)
    if (existingTab) return

    let content = ''
    let language = 'plaintext'
    
    switch (file.name) {
      case 'index.tsx':
        content = `import React from 'react';

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1>Welcome to Kriya IDE</h1>
      <p>Start coding...</p>
    </div>
  );
}`
        language = 'typescript'
        break
      case 'styles.css':
        content = `body {
  font-family: 'Inter', sans-serif;
  background: #000;
  color: #fff;
}`
        language = 'css'
        break
      case 'package.json':
        content = `{
  "name": "kriya-ide",
  "version": "0.1.0"
}`
        language = 'json'
        break
      default:
        content = `// ${file.name}`
        language = file.name.endsWith('.ts') || file.name.endsWith('.tsx') ? 'typescript' : 'javascript'
    }

    addTab({
      id: file.name,
      name: file.name,
      path: `/${file.name}`,
      content,
      language,
      isDirty: false,
      icon: file.icon
    })
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
          onClick={() => setAIModal(true)} 
          className="ph-fill ph-sparkle text-lg text-zinc-700 hover:text-white cursor-pointer transition"
        ></i>
        
        <div className="mt-auto flex flex-col gap-5 items-center">
          <i 
            onClick={() => setSettingsModal(true)} 
            className="ph-fill ph-gear-six text-lg text-zinc-700 hover:text-white cursor-pointer transition"
          ></i>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-700 to-white border-line cursor-pointer"></div>
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
                <div className="flex gap-2">
                  <i className="ph ph-file-plus text-zinc-600 hover:text-white cursor-pointer text-xs transition"></i>
                  <i className="ph ph-folder-plus text-zinc-600 hover:text-white cursor-pointer text-xs transition"></i>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-y-auto">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-white/5 rounded-lg border-line mb-2">
                  <i className="ph-fill ph-caret-down text-[8px]"></i>
                  <i className="ph-fill ph-folder text-white"></i>
                  <span>kriya-app</span>
                </div>
                <div className="ml-4 border-l border-zinc-900 pl-3 space-y-0.5">
                  {projectFiles.map(file => {
                    const isActive = tabs.some(tab => tab.name === file.name)
                    return (
                      <div 
                        key={file.name}
                        onClick={() => openFile(file)} 
                        className={`flex items-center gap-2.5 px-3 py-2 text-[11px] rounded-lg cursor-pointer transition ${
                          isActive ? 'text-white bg-white/10' : 'text-zinc-600 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <i className={`${file.icon} text-sm`}></i>
                        <span className="flex-1">{file.name}</span>
                        {file.modified && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Other panels simplified */}
          {activePanel !== 'files' && (
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
    </>
  )
}