'use client'

import { useState, useEffect } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'

// Debug Service placeholder interface
interface DebugSession {
  status: 'running' | 'paused' | 'stopped'
  variables: Array<{ name: string; value: string; type: string }>
  callStack: Array<{ name: string; file: string; line: number }>
}

interface DebugConfiguration {
  type: string
  name: string
  request: string
  program?: string
  url?: string
}

class DebugService {
  private static instance: DebugService
  private currentSession: DebugSession | null = null

  static getInstance(): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService()
    }
    return DebugService.instance
  }

  getCurrentSession(): DebugSession | null {
    return this.currentSession
  }

  async startDebugSession(config: DebugConfiguration): Promise<DebugSession> {
    console.log('Starting debug session with config:', config)
    // Simulate debug session
    this.currentSession = {
      status: 'running',
      variables: [
        { name: 'counter', value: '5', type: 'number' },
        { name: 'name', value: '&quot;Kriya IDE&quot;', type: 'string' },
        { name: 'isRunning', value: 'true', type: 'boolean' }
      ],
      callStack: [
        { name: 'main', file: 'index.js', line: 1 },
        { name: 'initializeApp', file: 'app.js', line: 15 },
        { name: 'setupDebugger', file: 'debug.js', line: 42 }
      ]
    }
    return this.currentSession
  }

  async stopDebugSession(): Promise<void> {
    this.currentSession = null
    console.log('Debug session stopped')
  }

  async continueExecution(): Promise<DebugSession> {
    if (this.currentSession) {
      this.currentSession.status = 'running'
    }
    return this.currentSession!
  }

  async pauseExecution(): Promise<DebugSession> {
    if (this.currentSession) {
      this.currentSession.status = 'paused'
    }
    return this.currentSession!
  }

  async stepOver(): Promise<DebugSession> {
    // Simulate step over
    return this.currentSession!
  }

  async stepInto(): Promise<DebugSession> {
    // Simulate step into
    return this.currentSession!
  }

  async stepOut(): Promise<DebugSession> {
    // Simulate step out
    return this.currentSession!
  }

  async evaluateExpression(expression: string): Promise<{ result: string }> {
    // Simulate expression evaluation
    return { result: `${expression} = &quot;evaluated&quot;` }
  }
}

const debugService = DebugService.getInstance()

export function DebugPanel() {
  const { 
    breakpoints, 
    debugSession, 
    startDebugSession, 
    stopDebugSession, 
    toggleBreakpoint,
    tabs,
    activeTab
  } = useIDEStore()
  
  const [currentSession, setCurrentSession] = useState<DebugSession | null>(null)
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugConfigs] = useState<DebugConfiguration[]>([
    {
      type: 'node',
      name: 'Launch Node.js',
      request: 'launch',
      program: '${workspaceFolder}/index.js'
    },
    {
      type: 'chrome',
      name: 'Launch Chrome',
      request: 'launch',
      url: 'http://localhost:3000'
    },
    {
      type: 'python',
      name: 'Launch Python',
      request: 'launch',
      program: '${workspaceFolder}/main.py'
    }
  ])
  const [selectedConfig, setSelectedConfig] = useState(0)
  const [watchExpressions, setWatchExpressions] = useState<string[]>([])
  const [newWatch, setNewWatch] = useState('')
  const [evaluationResults, setEvaluationResults] = useState<Record<string, string>>({})

  useEffect(() => {
    const session = debugService.getCurrentSession()
    setCurrentSession(session)
    setIsDebugging(session !== null)
  }, [debugSession])

  const handleStartDebug = async () => {
    try {
      const config = debugConfigs[selectedConfig]
      const activeTabData = tabs.find(tab => tab.id === activeTab)
      
      if (activeTabData && activeTabData.path) {
        // Update config with active file path
        config.program = activeTabData.path
      }
      
      const session = await debugService.startDebugSession(config)
      setCurrentSession(session)
      setIsDebugging(true)
      startDebugSession()
    } catch (error) {
      console.error('Failed to start debug session:', error)
    }
  }

  const handleStopDebug = async () => {
    try {
      await debugService.stopDebugSession()
      setCurrentSession(null)
      setIsDebugging(false)
      stopDebugSession()
    } catch (error) {
      console.error('Failed to stop debug session:', error)
    }
  }

  const handleContinue = async () => {
    if (!currentSession) return
    try {
      const session = await debugService.continueExecution()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to continue:', error)
    }
  }

  const handlePause = async () => {
    if (!currentSession) return
    try {
      const session = await debugService.pauseExecution()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to pause:', error)
    }
  }

  const handleStepOver = async () => {
    if (!currentSession) return
    try {
      const session = await debugService.stepOver()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to step over:', error)
    }
  }

  const handleStepInto = async () => {
    if (!currentSession) return
    try {
      const session = await debugService.stepInto()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to step into:', error)
    }
  }

  const handleStepOut = async () => {
    if (!currentSession) return
    try {
      const session = await debugService.stepOut()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to step out:', error)
    }
  }

  const addWatchExpression = () => {
    const trimmed = newWatch.trim()
    if (trimmed && !watchExpressions.includes(trimmed)) {
      const newExpressions = [...watchExpressions, trimmed]
      setWatchExpressions(newExpressions)
      setNewWatch('')
      evaluateWatch(trimmed)
    }
  }

  const evaluateWatch = async (expression: string) => {
    if (!isDebugging) return
    
    try {
      const result = await debugService.evaluateExpression(expression)
      setEvaluationResults(prev => ({ ...prev, [expression]: result.result }))
    } catch (error) {
      setEvaluationResults(prev => ({ ...prev, [expression]: 'Error: Unable to evaluate' }))
    }
  }

  const removeWatch = (index: number) => {
    const expression = watchExpressions[index]
    const newExpressions = watchExpressions.filter((_, i) => i !== index)
    setWatchExpressions(newExpressions)
    
    setEvaluationResults(prev => {
      const newResults = { ...prev }
      delete newResults[expression]
      return newResults
    })
  }

  const getActiveBreakpoints = () => {
    return Object.entries(breakpoints).flatMap(([file, lines]) => 
      lines.map(line => ({ file, line }))
    )
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <i className="ph ph-bug text-zinc-400 text-sm"></i>
          <span className="text-sm text-zinc-300 font-medium">Debug</span>
        </div>
        
        <div className="flex items-center gap-1">
          {!isDebugging ? (
            <button
              onClick={handleStartDebug}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Start Debugging (F5)"
            >
              <i className="ph ph-play text-xs"></i>
              Start
            </button>
          ) : (
            <>
              <button
                onClick={currentSession?.status === 'running' ? handlePause : handleContinue}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title={currentSession?.status === 'running' ? 'Pause (F6)' : 'Continue (F5)'}
              >
                <i className={`ph ${currentSession?.status === 'running' ? 'ph-pause' : 'ph-play'} text-xs`}></i>
              </button>
              <button
                onClick={handleStepOver}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Step Over (F10)"
              >
                <i className="ph ph-arrow-bend-down-right text-xs"></i>
              </button>
              <button
                onClick={handleStepInto}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Step Into (F11)"
              >
                <i className="ph ph-arrow-down text-xs"></i>
              </button>
              <button
                onClick={handleStepOut}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Step Out (Shift+F11)"
              >
                <i className="ph ph-arrow-up text-xs"></i>
              </button>
              <button
                onClick={handleStopDebug}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="Stop (Shift+F5)"
              >
                <i className="ph ph-stop text-xs"></i>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Debug Configuration */}
        {!isDebugging && (
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <i className="ph ph-gear text-zinc-500 text-xs"></i>
              <span className="text-xs text-zinc-400 font-medium">Configuration</span>
            </div>
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
            >
              {debugConfigs.map((config, index) => (
                <option key={index} value={index}>{config.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Variables */}
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <i className="ph ph-brackets-curly text-zinc-500 text-xs"></i>
            <span className="text-xs text-zinc-400 font-medium">Variables</span>
          </div>
          <div className="bg-zinc-900 rounded border border-zinc-800 p-2 max-h-32 overflow-y-auto">
            {currentSession?.variables && currentSession.variables.length > 0 ? (
              <div className="space-y-1">
                {currentSession.variables.map((variable, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{variable.name}</span>
                    <span className="text-zinc-300 font-mono">{variable.value}</span>
                    <span className="text-zinc-600 text-[10px]">{variable.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-600 text-center py-2">No variables in scope</div>
            )}
          </div>
        </div>
        
        {/* Watch Expressions */}
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <i className="ph ph-eye text-zinc-500 text-xs"></i>
            <span className="text-xs text-zinc-400 font-medium">Watch</span>
          </div>
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newWatch}
                onChange={(e) => setNewWatch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWatchExpression()}
                placeholder="Add expression"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <button
                onClick={addWatchExpression}
                className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              >
                <i className="ph ph-plus text-xs"></i>
              </button>
            </div>
            {watchExpressions.map((expression, index) => (
              <div key={index} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{expression}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-300 font-mono">
                        {evaluationResults[expression] || 'undefined'}
                      </span>
                      <button
                        onClick={() => removeWatch(index)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <i className="ph ph-x text-xs"></i>
                      </button>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Call Stack */}
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <i className="ph ph-stack text-zinc-500 text-xs"></i>
            <span className="text-xs text-zinc-400 font-medium">Call Stack</span>
          </div>
          <div className="bg-zinc-900 rounded border border-zinc-800 p-2 max-h-32 overflow-y-auto">
            {currentSession?.callStack && currentSession.callStack.length > 0 ? (
              <div className="space-y-1">
                {currentSession.callStack.map((frame, index) => (
                  <div key={index} className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer transition-colors">
                    <div className="text-xs text-zinc-300">{frame.name}</div>
                    <div className="text-[10px] text-zinc-600">{frame.file}:{frame.line}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-600 text-center py-2">Not debugging</div>
            )}
          </div>
        </div>
        
        {/* Breakpoints */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <i className="ph ph-circle text-zinc-500 text-xs"></i>
            <span className="text-xs text-zinc-400 font-medium">Breakpoints</span>
          </div>
          <div className="space-y-1">
            {getActiveBreakpoints().map(({ file, line }) => (
              <div key={`${file}-${line}`} className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded">
                <i className="ph-fill ph-circle text-red-500 text-xs"></i>
                <div className="flex-1">
                  <div className="text-xs text-zinc-300">{file.split('/').pop()}</div>
                  <div className="text-[10px] text-zinc-600">Line {line}</div>
                </div>
                <button 
                  onClick={() => toggleBreakpoint(file, line)}
                  className="text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <i className="ph ph-x text-xs"></i>
                </button>
              </div>
            ))}
            {getActiveBreakpoints().length === 0 && (
              <div className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 rounded p-3 text-center">
                No breakpoints set
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple interfaces for extensions
interface Extension {
  id: string
  name: string
  version: string
  category: string
  downloads: string
  status: 'active' | 'disabled' | 'update-available'
  icon: string
  description?: string
  rating?: number
}

export function ExtensionsPanel() {
  const { } = useIDEStore()
  
  // Local state for extensions
  const [extensionSearchQuery, setExtensionSearchQuery] = useState('')
  const [extensions] = useState<Extension[]>([
    {
      id: 'prettier',
      name: 'Prettier',
      version: '3.0.0',
      category: 'Formatters',
      downloads: '10M+',
      status: 'active',
      icon: 'ph-code'
    },
    {
      id: 'eslint',
      name: 'ESLint',
      version: '8.0.0',
      category: 'Linters',
      downloads: '8M+',
      status: 'active',
      icon: 'ph-bug'
    }
  ])
  
  const toggleExtension = (id: string) => console.log('Toggle:', id)
  const updateExtension = (id: string) => console.log('Update:', id)
  const checkForExtensionUpdates = () => console.log('Check updates')
  
  const [marketplaceExtensions] = useState<Extension[]>([])
  const [marketplaceLoading] = useState(false)
  const [marketplaceCategories] = useState(['All', 'Themes', 'Programming Languages', 'Debuggers', 'Formatters'])
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Simulated marketplace extensions
  const simulatedMarketplaceExtensions: Extension[] = [
    {
      id: 'prettier-marketplace',
      name: 'Prettier',
      version: '10.0.0',
      category: 'Formatters',
      downloads: '10M+',
      status: 'active',
      icon: 'ph-code',
      description: 'Code formatter',
      rating: 4.8
    },
    {
      id: 'eslint-marketplace',
      name: 'ESLint',
      version: '9.0.0',
      category: 'Linters',
      downloads: '8M+',
      status: 'active',
      icon: 'ph-bug',
      description: 'JavaScript linter',
      rating: 4.7
    }
  ]

  const filteredExtensions = extensions.filter(ext => {
    return !extensionSearchQuery || 
      ext.name.toLowerCase().includes(extensionSearchQuery.toLowerCase()) ||
      ext.category.toLowerCase().includes(extensionSearchQuery.toLowerCase())
  })

  const handleInstallExtension = (ext: Extension) => {
    console.log('Installing extension:', ext.name)
  }

  const handleUninstallExtension = (id: string) => {
    console.log('Uninstalling extension:', id)
  }

  const handleSearchMarketplace = () => {
    console.log('Searching marketplace with:', extensionSearchQuery, selectedCategory)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <i className="ph ph-puzzle-piece text-zinc-400 text-sm"></i>
          <span className="text-sm text-zinc-300 font-medium">Extensions</span>
        </div>
        <button 
          onClick={() => checkForExtensionUpdates()}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        >
          <i className="ph ph-arrow-clockwise text-xs"></i>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-zinc-800">
        <input
          type="text"
          placeholder="Search extensions..."
          value={extensionSearchQuery}
          onChange={(e) => setExtensionSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('installed')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'installed' 
              ? 'text-white border-b-2 border-blue-500 bg-zinc-900' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Installed ({extensions.length})
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'marketplace' 
              ? 'text-white border-b-2 border-blue-500 bg-zinc-900' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Marketplace
        </button>
      </div>

      {/* Category Filter */}
      {activeTab === 'marketplace' && (
        <div className="p-3 border-b border-zinc-800">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            {marketplaceCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      )}

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'installed' ? (
          <div className="p-3">
            {filteredExtensions.length > 0 ? (
              <div className="space-y-2">
                {filteredExtensions.map(ext => (
                  <div key={ext.id} className="p-3 border border-zinc-800 rounded hover:border-zinc-700">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                        <i className={`ph ${ext.icon} text-zinc-400`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-white">{ext.name}</h3>
                          <div className={`w-2 h-2 rounded-full ${
                            ext.status === 'active' ? 'bg-green-400' :
                            ext.status === 'update-available' ? 'bg-yellow-400' : 'bg-zinc-600'
                          }`}></div>
                        </div>
                        <p className="text-xs text-zinc-500 mb-2">{ext.category}</p>
                        <div className="flex items-center gap-2">
                          {ext.status === 'update-available' && (
                            <button
                              onClick={() => updateExtension(ext.id)}
                              className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                              Update
                            </button>
                          )}
                          <button
                            onClick={() => toggleExtension(ext.id)}
                            className={`px-2 py-1 text-xs rounded ${
                              ext.status === 'active'
                                ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {ext.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleUninstallExtension(ext.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="ph ph-puzzle-piece text-4xl text-zinc-600 mb-3"></i>
                <p className="text-sm text-zinc-400">No extensions installed</p>
                <p className="text-xs text-zinc-500 mt-1">Browse marketplace to install extensions</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3">
            {marketplaceLoading ? (
              <div className="text-center py-12">
                <i className="ph ph-spinner animate-spin text-3xl text-zinc-400 mb-3"></i>
                <p className="text-sm text-zinc-400">Loading extensions...</p>
              </div>
            ) : simulatedMarketplaceExtensions.length > 0 ? (
              <div className="space-y-2">
                {simulatedMarketplaceExtensions.map(ext => {
                  const isInstalled = extensions.some(installed => installed.id === ext.id)
                  return (
                    <div key={ext.id} className="p-3 border border-zinc-800 rounded hover:border-zinc-700">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                          <i className={`ph ${ext.icon} text-zinc-400`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-white">{ext.name}</h3>
                            {ext.rating && (
                              <div className="flex items-center gap-1">
                                <i className="ph-fill ph-star text-yellow-400 text-xs"></i>
                                <span className="text-xs text-zinc-400">{ext.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mb-2">{ext.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-zinc-500">
                              {ext.category} • v{ext.version} • {ext.downloads}
                            </div>
                            {isInstalled ? (
                              <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                                Installed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleInstallExtension(ext)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Install
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="ph ph-magnifying-glass text-4xl text-zinc-600 mb-3"></i>
                <p className="text-sm text-zinc-400">No extensions found</p>
                <p className="text-xs text-zinc-500 mt-1">Try different search terms</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Database Panel
interface DatabaseConnection {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'
  host: string
  port: number
  database: string
  username: string
  isConnected: boolean
}

interface QueryResult {
  rows: Array<Record<string, any>>
  rowCount: number
  executionTime: number
}

export function DatabasePanel() {
  const { } = useIDEStore()
  
  // Local state for database
  const [databaseConnections] = useState<DatabaseConnection[]>([])
  const [activeDatabaseConnection, setActiveDatabaseConnection] = useState<string | null>(null)
  const [databaseQuery, setDatabaseQuery] = useState('')
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [databaseTables, setDatabaseTables] = useState<string[]>([])
  
  const connectToDatabase = async (form: any) => {}
  const disconnectFromDatabase = async (connectionId: string) => {}
  const executeQuery = async (conn: string, query: string) => {}
  const refreshDatabaseTables = async () => {}
  
  const [activeTab, setActiveTab] = useState<'connections' | 'query' | 'results'>('connections')
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [connectionForm, setConnectionForm] = useState({
    type: 'postgresql' as 'mysql' | 'postgresql' | 'sqlite' | 'mongodb',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: ''
  })

  const handleConnect = async () => {
    await connectToDatabase(connectionForm)
    setShowConnectionForm(false)
    setConnectionForm({
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: ''
    })
  }

  const handleExecuteQuery = async () => {
    if (!activeDatabaseConnection || !databaseQuery.trim()) return
    await executeQuery(activeDatabaseConnection, databaseQuery)
    setActiveTab('results')
  }

  const handleDisconnect = async (connectionId: string) => {
    await disconnectFromDatabase(connectionId)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800">
        <span className="text-sm text-white font-medium">Database</span>
        <button 
          onClick={() => setShowConnectionForm(true)}
          className="p-1.5 text-zinc-500 hover:text-white rounded text-xs"
        >
          +
        </button>
      </div>

      {/* Connection Form Modal */}
      {showConnectionForm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 w-80">
            <h3 className="text-sm font-medium text-white mb-3">New Database Connection</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Type</label>
                <select
                  value={connectionForm.type}
                  onChange={(e) => setConnectionForm(prev => ({ 
                    ...prev, 
                    type: e.target.value as any,
                    port: e.target.value === 'mysql' ? 3306 : 
                          e.target.value === 'postgresql' ? 5432 :
                          e.target.value === 'mongodb' ? 27017 : 3306
                  }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Host</label>
                  <input
                    type="text"
                    value={connectionForm.host}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Port</label>
                  <input
                    type="number"
                    value={connectionForm.port}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Database</label>
                <input
                  type="text"
                  value={connectionForm.database}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, database: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Username</label>
                <input
                  type="text"
                  value={connectionForm.username}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={connectionForm.password}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleConnect}
                className="flex-1 px-3 py-2 text-xs bg-white text-black rounded hover:bg-zinc-200"
              >
                Connect
              </button>
              <button
                onClick={() => setShowConnectionForm(false)}
                className="flex-1 px-3 py-2 text-xs bg-zinc-700 text-white rounded hover:bg-zinc-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'connections' 
              ? 'text-white border-b border-white' 
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Connections
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'query' 
              ? 'text-white border-b border-white' 
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Query
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'results' 
              ? 'text-white border-b border-white' 
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Results
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'connections' && (
          <div>
            {databaseConnections.length > 0 ? (
              <div className="space-y-2">
                {databaseConnections.map((conn: DatabaseConnection) => (
                  <div 
                    key={conn.id}
                    onClick={() => setActiveDatabaseConnection(conn.id)}
                    className={`p-3 border border-zinc-800 rounded hover:border-zinc-700 cursor-pointer ${
                      activeDatabaseConnection === conn.id ? 'border-zinc-600 bg-zinc-900' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        conn.isConnected ? 'bg-green-500' : 'bg-zinc-600'
                      }`}></div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">{conn.name}</h3>
                        <p className="text-xs text-zinc-500">{conn.type} • {conn.host}:{conn.port}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDisconnect(conn.id)
                        }}
                        className="text-xs text-zinc-500 hover:text-red-400 p-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl text-zinc-600 mb-3">🗄️</div>
                <p className="text-sm text-zinc-500">No database connections</p>
                <p className="text-xs text-zinc-600 mt-1">Click + to add a connection</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-3">
            {activeDatabaseConnection ? (
              <>
                <div>
                  <label className="text-xs text-zinc-500 mb-2 block">SQL Query</label>
                  <textarea 
                    value={databaseQuery}
                    onChange={(e) => setDatabaseQuery(e.target.value)}
                    placeholder="SELECT * FROM users WHERE id = 1;"
                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                  />
                </div>
                <button 
                  onClick={handleExecuteQuery}
                  disabled={queryLoading || !databaseQuery.trim()}
                  className="w-full px-3 py-2 text-xs bg-white text-black rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {queryLoading ? 'Executing...' : 'Execute Query'}
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl text-zinc-600 mb-3">⚡</div>
                <p className="text-sm text-zinc-500">No active connection</p>
                <p className="text-xs text-zinc-600 mt-1">Select a connection to run queries</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            {queryResults ? (
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 mb-2">
                  {queryResults.rowCount} rows returned in {queryResults.executionTime}ms
                </div>
                {queryResults.rows.length > 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                    {/* Header */}
                    <div className="flex bg-zinc-800 border-b border-zinc-700">
                      {Object.keys(queryResults.rows[0]).map(key => (
                        <div key={key} className="flex-1 px-3 py-2 text-xs font-medium text-zinc-300 border-r border-zinc-700 last:border-r-0">
                          {key}
                        </div>
                      ))}
                    </div>
                    {/* Rows */}
                    {queryResults.rows.slice(0, 50).map((row: any, index: number) => (
                      <div key={index} className="flex border-b border-zinc-800 last:border-b-0">
                        {Object.values(row).map((value, i) => (
                          <div key={i} className="flex-1 px-3 py-2 text-xs text-white border-r border-zinc-800 last:border-r-0 truncate">
                            {String(value)}
                          </div>
                        ))}
                      </div>
                    ))}
                    {queryResults.rows.length > 50 && (
                      <div className="px-3 py-2 text-xs text-zinc-500 text-center">
                        Showing first 50 of {queryResults.rows.length} rows
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-center">
                    <p className="text-xs text-zinc-500">Query executed successfully</p>
                    <p className="text-xs text-zinc-600">No rows returned</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl text-zinc-600 mb-3">📊</div>
                <p className="text-sm text-zinc-500">No query results</p>
                <p className="text-xs text-zinc-600 mt-1">Execute a query to see results</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// API Panel
interface APIRequest {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: string
}

interface Collection {
  id: string
  name: string
  requestCount: number
}

export function APIPanel() {
  const { 
    apiRequests, 
    activeApiRequest, 
    addApiRequest, 
    setActiveApiRequest,
    deleteApiRequest,
    updateApiRequest
  } = useIDEStore()
  
  // Local state for collections since they're not in the store yet
  const [collections] = useState<Collection[]>([])
  const loadCollections = () => {}
  const saveCollection = async () => {}
  const loadCollection = () => {}
  const deleteCollection = () => {}
  
  const [newRequest, setNewRequest] = useState({
    name: '',
    method: 'GET' as const,
    url: ''
  })
  
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'response'>('params')
  const [params, setParams] = useState<Array<{key: string, value: string, enabled: boolean}>>([])
  const [headers, setHeaders] = useState<Array<{key: string, value: string, enabled: boolean}>>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<{status: number, data: any, time: number, headers?: any} | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [showCollections, setShowCollections] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [showSaveCollection, setShowSaveCollection] = useState(false)

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  const createRequest = () => {
    if (!newRequest.name || !newRequest.url) return
    
    const request = {
      id: Date.now().toString(),
      name: newRequest.name,
      method: newRequest.method,
      url: newRequest.url,
      headers: headers.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
      body: body
    }
    
    addApiRequest(request)
    setNewRequest({ name: '', method: 'GET', url: '' })
    setShowNewRequestForm(false)
  }

  const sendRequest = async () => {
    const activeReq = apiRequests.find(req => req.id === activeApiRequest)
    if (!activeReq) return

    setIsLoading(true)
    setActiveTab('response')
    const startTime = Date.now()

    try {
      // Build parameters object
      const requestParams = params.filter(p => p.enabled && p.key).reduce((acc, p) => {
        acc[p.key] = p.value
        return acc
      }, {} as Record<string, string>)

      // Build headers object
      const requestHeaders = headers.filter(h => h.enabled && h.key).reduce((acc, h) => {
        acc[h.key] = h.value
        return acc
      }, {} as Record<string, string>)

      // Use our proxy API
      const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: activeReq.method,
          url: activeReq.url,
          headers: requestHeaders,
          body: activeReq.method !== 'GET' ? body : undefined,
          params: requestParams
        })
      })

      const proxyData = await proxyResponse.json()
      
      setResponse({
        status: proxyData.status,
        data: proxyData.data,
        time: proxyData.time,
        headers: proxyData.headers
      })
    } catch (error) {
      setResponse({
        status: 0,
        data: { error: error instanceof Error ? error.message : 'Request failed' },
        time: Date.now() - startTime
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }])
  }

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const updateParam = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    setParams(newParams)
  }

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    setHeaders(newHeaders)
  }

  const activeRequest = apiRequests.find(req => req.id === activeApiRequest)

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-600 text-white'
      case 'POST': return 'bg-blue-600 text-white'
      case 'PUT': return 'bg-yellow-600 text-black'
      case 'DELETE': return 'bg-red-600 text-white'
      case 'PATCH': return 'bg-purple-600 text-white'
      default: return 'bg-zinc-600 text-white'
    }
  }

  const getStatusColor = (status: number) => {
    if (status === 0) return 'bg-zinc-600 text-white'
    if (status < 200) return 'bg-blue-600 text-white'
    if (status < 300) return 'bg-green-600 text-white'
    if (status < 400) return 'bg-yellow-600 text-black'
    if (status < 500) return 'bg-orange-600 text-white'
    return 'bg-red-600 text-white'
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <i className="ph ph-globe text-zinc-400 text-sm"></i>
          <span className="text-sm text-zinc-300 font-medium">API Client</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowCollections(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Collections"
          >
            <i className="ph ph-folder text-xs"></i>
          </button>
          {apiRequests.length > 0 && (
            <button 
              onClick={() => setShowSaveCollection(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Save Collection"
            >
              <i className="ph ph-floppy-disk text-xs"></i>
            </button>
          )}
          <button 
            onClick={() => setShowNewRequestForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="New Request"
          >
            <i className="ph ph-plus text-xs"></i>
            New
          </button>
        </div>
      </div>
      
      {/* New Request Form Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">New Request</h3>
                <p className="text-sm text-zinc-400">Create a new API request</p>
              </div>
              <button
                onClick={() => setShowNewRequestForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">Request Name</label>
                <input
                  type="text"
                  placeholder="e.g., Get User Profile"
                  value={newRequest.name}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-2">Method</label>
                  <select
                    value={newRequest.method}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, method: e.target.value as any }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white focus:border-zinc-600 focus:outline-none transition-colors"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-sm font-medium text-zinc-300 block mb-2">URL</label>
                  <input
                    type="text"
                    placeholder="https://api.example.com/users"
                    value={newRequest.url}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewRequestForm(false)
                  setNewRequest({ name: '', method: 'GET', url: '' })
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createRequest}
                disabled={!newRequest.name.trim() || !newRequest.url.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections Modal */}
      {showCollections && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Collections</h3>
              <button
                onClick={() => setShowCollections(false)}
                className="text-zinc-400 hover:text-white"
              >
                <i className="ph ph-x text-sm"></i>
              </button>
            </div>
            {collections.length > 0 ? (
              <div className="space-y-2">
                {collections.map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between p-3 bg-zinc-800 border border-zinc-700 rounded">
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{collection.name}</div>
                      <div className="text-xs text-zinc-400">{collection.requestCount} requests</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // loadCollection(collection.id)
                          setShowCollections(false)
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          // deleteCollection(collection.id)
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="ph ph-folder text-3xl text-zinc-600 mb-2"></i>
                <p className="text-sm text-zinc-400">No collections saved</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Collection Modal */}
      {showSaveCollection && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 w-80">
            <h3 className="text-sm font-medium text-white mb-3">Save Collection</h3>
            <input
              type="text"
              placeholder="Collection name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (collectionName.trim()) {
                    // await saveCollection(collectionName.trim())
                    setCollectionName('')
                    setShowSaveCollection(false)
                  }
                }}
                disabled={!collectionName.trim()}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveCollection(false)
                  setCollectionName('')
                }}
                className="flex-1 px-3 py-2 text-sm bg-zinc-700 text-white rounded hover:bg-zinc-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {apiRequests.length > 0 ? (
          <>
            {/* Request List */}
            <div className="p-3 border-b border-zinc-800 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {apiRequests.map(request => (
                  <div 
                    key={request.id}
                    onClick={() => setActiveApiRequest(request.id)}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      activeApiRequest === request.id ? 'bg-zinc-800 border border-zinc-700' : 'hover:bg-zinc-900'
                    }`}
                  >
                    <span className={`px-2 py-1 text-[10px] font-bold rounded ${getMethodColor(request.method)}`}>
                      {request.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-300 font-medium truncate">{request.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate font-mono">{request.url}</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteApiRequest(request.id)
                      }}
                      className="text-xs text-zinc-600 hover:text-red-400 p-1"
                    >
                      <i className="ph ph-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Request Details */}
            {activeRequest && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Request Header */}
                <div className="p-3 border-b border-zinc-800 bg-zinc-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getMethodColor(activeRequest.method)}`}>
                      {activeRequest.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-300 font-medium">{activeRequest.name}</div>
                      <div className="text-xs text-zinc-500 font-mono truncate">{activeRequest.url}</div>
                    </div>
                  </div>
                  <button 
                    onClick={sendRequest}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <i className="ph ph-spinner animate-spin"></i>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="ph ph-paper-plane-tilt"></i>
                        Send Request
                      </>
                    )}
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 bg-zinc-900/20">
                  {[
                    { key: 'params', label: 'Params', icon: 'ph-list-bullets' },
                    { key: 'headers', label: 'Headers', icon: 'ph-file-text' },
                    { key: 'body', label: 'Body', icon: 'ph-code' },
                    { key: 'response', label: 'Response', icon: 'ph-arrow-bend-up-left' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                        activeTab === tab.key 
                          ? 'text-white border-b-2 border-blue-500 bg-zinc-800' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <i className={`ph ${tab.icon} text-xs`}></i>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-3">
                  {activeTab === 'params' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">Query Parameters</span>
                        <button 
                          onClick={addParam} 
                          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-zinc-800 rounded"
                        >
                          <i className="ph ph-plus text-xs"></i>
                          Add
                        </button>
                      </div>
                      {params.length > 0 ? (
                        <div className="space-y-2">
                          {params.map((param, i) => (
                            <div key={i} className="flex gap-2 items-center p-2 bg-zinc-900 border border-zinc-800 rounded">
                              <input 
                                type="checkbox" 
                                checked={param.enabled}
                                onChange={(e) => updateParam(i, 'enabled', e.target.checked)}
                                className="w-3 h-3 accent-blue-500" 
                              />
                              <input 
                                placeholder="Key" 
                                value={param.key}
                                onChange={(e) => updateParam(i, 'key', e.target.value)}
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                              />
                              <input 
                                placeholder="Value" 
                                value={param.value}
                                onChange={(e) => updateParam(i, 'value', e.target.value)}
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                              />
                              <button 
                                onClick={() => removeParam(i)}
                                className="text-xs text-zinc-600 hover:text-red-400 p-1"
                              >
                                <i className="ph ph-trash"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <i className="ph ph-list-bullets text-3xl text-zinc-600 mb-2"></i>
                          <p className="text-xs text-zinc-500">No parameters added</p>
                          <p className="text-xs text-zinc-600 mt-1">Click &quot;Add&quot; to add query parameters</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'headers' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">Request Headers</span>
                        <button 
                          onClick={addHeader} 
                          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-zinc-800 rounded"
                        >
                          <i className="ph ph-plus text-xs"></i>
                          Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {headers.map((header, i) => (
                          <div key={i} className="flex gap-2 items-center p-2 bg-zinc-900 border border-zinc-800 rounded">
                            <input 
                              type="checkbox" 
                              checked={header.enabled} 
                              onChange={(e) => updateHeader(i, 'enabled', e.target.checked)}
                              className="w-3 h-3 accent-blue-500" 
                            />
                            <input 
                              placeholder="Header name" 
                              value={header.key}
                              onChange={(e) => updateHeader(i, 'key', e.target.value)}
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                            />
                            <input 
                              placeholder="Header value" 
                              value={header.value}
                              onChange={(e) => updateHeader(i, 'value', e.target.value)}
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                            />
                            <button 
                              onClick={() => removeHeader(i)}
                              className="text-xs text-zinc-600 hover:text-red-400 p-1"
                            >
                                <i className="ph ph-trash"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'body' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">Request Body</span>
                      </div>
                      <textarea 
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
                        className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-zinc-300 font-mono placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none"
                      />
                    </div>
                  )}

                  {activeTab === 'response' && (
                    <div className="space-y-3">
                      {response ? (
                        <>
                          <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${getStatusColor(response.status)}`}>
                              {response.status === 0 ? 'ERROR' : response.status}
                            </span>
                            <span className="text-xs text-zinc-400">
                              <i className="ph ph-clock mr-1"></i>
                              {response.time}ms
                            </span>
                          </div>
                          
                          {/* Response Body */}
                          <div className="space-y-2">
                            <span className="text-xs text-zinc-400 font-medium">Response Body</span>
                            <pre className="bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-zinc-300 font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                              {typeof response.data === 'string' 
                                ? response.data 
                                : JSON.stringify(response.data, null, 2)
                              }
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <i className="ph ph-arrow-bend-up-left text-4xl text-zinc-600 mb-3"></i>
                          <p className="text-sm text-zinc-400">No response yet</p>
                          <p className="text-xs text-zinc-500 mt-1">Send a request to see the response</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <i className="ph ph-globe text-6xl text-zinc-600 mb-4"></i>
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">No API Requests</h3>
              <p className="text-sm text-zinc-500 mb-4">Create your first API request to get started</p>
              <button 
                onClick={() => setShowNewRequestForm(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <i className="ph ph-plus"></i>
                New Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}