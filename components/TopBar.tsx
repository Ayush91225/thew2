'use client'

import { useIDEStore } from '@/stores/ide-store'
import { useHotkeys } from 'react-hotkeys-hook'
import { useState } from 'react'

export default function TopBar() {
  const { 
    view, 
    setView, 
    collab, 
    setCollab, 
    environment, 
    setEnvironment, 
    setYamlModal, 
    yamlModal, 
    activeYamlFile, 
    runYaml, 
    activeTab, 
    tabs,
    isRunning
  } = useIDEStore()
  const [showEnvDropdown, setShowEnvDropdown] = useState(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)

  return (
    <nav className="h-12 border-b-line px-4 flex items-center justify-between bg-black shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 cursor-pointer group">

          <span className="font-black text-xs tracking-tight text-white">KRIYA</span>
        </div>
        <div className="h-4 w-px bg-zinc-800"></div>
        <div className="flex gap-5">
          <button 
            onClick={() => setView('workspace')} 
            className={`text-[11px] font-bold hover:text-white transition ${view === 'workspace' ? 'text-white' : 'text-zinc-600'}`}
          >
            Workspace
          </button>
          <button 
            onClick={() => setView('deploy')} 
            className={`text-[11px] font-bold hover:text-white transition ${view === 'deploy' ? 'text-white' : 'text-zinc-600'}`}
          >
            Deployments
          </button>
          <button 
            onClick={() => setView('analytics')} 
            className={`text-[11px] font-bold hover:text-white transition ${view === 'analytics' ? 'text-white' : 'text-zinc-600'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setView('db')} 
            className={`text-[11px] font-bold hover:text-white transition ${view === 'db' ? 'text-white' : 'text-zinc-600'}`}
          >
            Database
          </button>
          <button 
            onClick={() => setView('logs')} 
            className={`text-[11px] font-bold hover:text-white transition ${view === 'logs' ? 'text-white' : 'text-zinc-600'}`}
          >
            Logs
          </button>
          <button 
            onClick={() => setView('monitoring')} 
            className={`text-[11px] font-bold hover:text-white transition ${view === 'monitoring' ? 'text-white' : 'text-zinc-600'}`}
          >
            Monitoring
          </button>
          <button 
            onClick={() => setView('settings')} 
            className={`text-[11px] font-bold hover:text-white transition ${view === 'settings' ? 'text-white' : 'text-zinc-600'}`}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-zinc-950 border-line rounded-lg p-0.5">
          <button 
            onClick={() => setCollab(false)} 
            className={`px-3 py-1 text-[9px] font-black rounded-md transition ${!collab ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
          >
            SOLO
          </button>
          <button 
            onClick={() => setCollab(true)} 
            className={`px-3 py-1 text-[9px] font-black rounded-md transition flex items-center gap-2 ${collab ? 'bg-white text-black' : 'text-zinc-600'}`}
          >
            {collab && <i className="ph ph-users-three"></i>}
            LIVE
          </button>
        </div>

        <button
          onClick={() => {
            const { terminalOpen, setTerminalOpen } = useIDEStore.getState()
            setTerminalOpen(!terminalOpen)
          }}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-950 border-line hover:bg-zinc-900 transition"
          title="Toggle Terminal"
        >
          <i className="ph ph-terminal-window text-white text-sm"></i>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowEnvDropdown(!showEnvDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border-line hover:bg-zinc-900 transition"
          >
            <div className="status-indicator"></div>
            <span className="text-[9px] font-black text-zinc-400">
              {environment.toUpperCase()}
            </span>
            <i className={`ph ph-caret-${showEnvDropdown ? 'up' : 'down'} text-xs text-zinc-400`}></i>
          </button>
          
          {showEnvDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-zinc-950 border-line rounded-lg shadow-xl z-50 min-w-[120px]">
              <button
                onClick={() => { setEnvironment('production'); setShowEnvDropdown(false) }}
                className={`w-full px-3 py-2 text-left text-[9px] font-black hover:bg-zinc-800 transition first:rounded-t-lg ${
                  environment === 'production' ? 'text-white bg-zinc-800' : 'text-zinc-400'
                }`}
              >
                PRODUCTION
              </button>
              <button
                onClick={() => { setEnvironment('development'); setShowEnvDropdown(false) }}
                className={`w-full px-3 py-2 text-left text-[9px] font-black hover:bg-zinc-800 transition last:rounded-b-lg ${
                  environment === 'development' ? 'text-white bg-zinc-800' : 'text-zinc-400'
                }`}
              >
                DEVELOPMENT
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border-line">
          <i className="ph-fill ph-check-circle text-white text-xs"></i>
          <span className="text-[9px] font-black text-zinc-400">BUILD OK</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-950 border-line hover:bg-zinc-900 transition"
            title="Account"
          >
            <i className="ph ph-user text-white text-sm"></i>
          </button>
          
          {showAccountDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl z-50 min-w-[200px]">
              <div className="p-3 border-b border-zinc-800">
                <div className="text-sm font-medium text-white">john.doe</div>
                <div className="text-xs text-zinc-400">john.doe@company.com</div>
              </div>
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs text-zinc-500">
                  <div className="mb-1">Company: Acme Corp</div>
                  <div className="mb-1">Team: Engineering</div>
                  <div>Project: kriya-ide</div>
                </div>
              </div>
              <div className="border-t border-zinc-800">
                <button
                  onClick={() => setShowAccountDropdown(false)}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition rounded-b-lg"
                >
                  <i className="ph ph-sign-out mr-2"></i>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setYamlModal(true)}
          className="px-3 py-1.5 text-xs bg-zinc-800 text-white rounded hover:bg-zinc-700 flex items-center gap-1"
        >
          <i className="ph ph-file-text"></i>
          YAML
        </button>

        <button 
          onClick={() => {
            const { isRunning } = useIDEStore.getState()
            if (isRunning) return
            
            useIDEStore.setState({ isRunning: true })
            
            setTimeout(() => {
              if (yamlModal && activeYamlFile) {
                runYaml(activeYamlFile)
              } else if (activeTab) {
                const activeFile = tabs.find(tab => tab.id === activeTab)
                if (activeFile?.language === 'yaml') {
                  console.log('Running YAML file:', activeFile.name)
                } else {
                  console.log('Running IDE project')
                }
              } else {
                console.log('Running IDE project')
              }
              
              useIDEStore.setState({ isRunning: false })
            }, 2000)
          }}
          disabled={isRunning}
          className={`btn-primary flex items-center gap-2 ${isRunning ? 'opacity-75' : ''}`}
        >
          <i className={`ph-fill ${isRunning ? 'ph-spinner animate-spin' : 'ph-rocket-launch'}`}></i>
          {isRunning ? 'RUNNING...' : 'RUN'}
        </button>
      </div>
    </nav>
  )
}