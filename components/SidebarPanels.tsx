'use client'

import { useState, useEffect } from 'react'
import { useIDEStore } from '@/stores/ide-store'
import { DebugService, DebugSession, DebugConfiguration } from '@/lib/debug-service'

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
  
  const debugService = DebugService.getInstance()

  useEffect(() => {
    const session = debugService.getCurrentSession()
    setCurrentSession(session)
    setIsDebugging(session !== null)
  }, [debugSession])

  const handleStartDebug = async () => {
    try {
      const config = debugConfigs[selectedConfig]
      const activeTabData = tabs.find(tab => tab.id === activeTab)
      
      if (activeTabData) {
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
    try {
      const session = await debugService.continueExecution()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to continue:', error)
    }
  }

  const handlePause = async () => {
    try {
      const session = await debugService.pauseExecution()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to pause:', error)
    }
  }

  const handleStepOver = async () => {
    try {
      const session = await debugService.stepOver()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to step over:', error)
    }
  }

  const handleStepInto = async () => {
    try {
      const session = await debugService.stepInto()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to step into:', error)
    }
  }

  const handleStepOut = async () => {
    try {
      const session = await debugService.stepOut()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to step out:', error)
    }
  }

  const addWatchExpression = () => {
    if (newWatch.trim()) {
      setWatchExpressions([...watchExpressions, newWatch.trim()])
      setNewWatch('')
      evaluateWatch(newWatch.trim())
    }
  }

  const evaluateWatch = async (expression: string) => {
    if (!isDebugging) return
    
    try {
      const result = await debugService.evaluateExpression(expression)
      setEvaluationResults(prev => ({ ...prev, [expression]: result.result }))
    } catch (error) {
      setEvaluationResults(prev => ({ ...prev, [expression]: 'Error' }))
    }
  }

  const removeWatch = (index: number) => {
    const expression = watchExpressions[index]
    setWatchExpressions(watchExpressions.filter((_, i) => i !== index))
    setEvaluationResults(prev => {
      const { [expression]: removed, ...rest } = prev
      return rest
    })
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
            {currentSession?.variables.length ? (
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
            {currentSession?.callStack.length ? (
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
            {Object.entries(breakpoints).map(([file, lines]) => 
              lines.map(line => (
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
              ))
            )}
            {Object.keys(breakpoints).length === 0 && (
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

export function ExtensionsPanel() {
  const {
    extensions,
    extensionSearchQuery,
    marketplaceExtensions,
    marketplaceLoading,
    marketplaceCategories,
    setExtensionSearchQuery,
    toggleExtension,
    updateExtension,
    installExtension,
    uninstallExtension,
    searchMarketplaceExtensions,
    checkForExtensionUpdates
  } = useIDEStore()

  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      searchMarketplaceExtensions('', 'All')
    }
  }, [searchMarketplaceExtensions])

  useEffect(() => {
    if (activeTab === 'marketplace' && typeof window !== 'undefined') {
      searchMarketplaceExtensions(extensionSearchQuery, selectedCategory)
    }
  }, [extensionSearchQuery, selectedCategory, activeTab, searchMarketplaceExtensions])

  const filteredExtensions = extensions.filter(ext => {
    return !extensionSearchQuery || 
      ext.name.toLowerCase().includes(extensionSearchQuery.toLowerCase()) ||
      ext.category.toLowerCase().includes(extensionSearchQuery.toLowerCase())
  })

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
                            onClick={() => uninstallExtension(ext.id)}
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
            ) : marketplaceExtensions.length > 0 ? (
              <div className="space-y-2">
                {marketplaceExtensions.map(ext => {
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
                                onClick={() => installExtension(ext)}
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

export function DatabasePanel() {
  const {
    databaseConnections,
    activeDatabaseConnection,
    databaseQuery,
    queryResults,
    queryLoading,
    databaseTables,
    connectToDatabase,
    disconnectFromDatabase,
    executeQuery,
    setDatabaseQuery,
    setActiveDatabaseConnection,
    refreshDatabaseTables
  } = useIDEStore()
  
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
    <div className="flex flex-col h-full">
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
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'connections' && (
          <div className="p-3">
            {databaseConnections.length > 0 ? (
              <div className="space-y-2">
                {databaseConnections.map(conn => (
                  <div 
                    key={conn.id}
                    onClick={() => setActiveDatabaseConnection(conn.id)}
                    className={`p-3 border border-zinc-800 rounded hover:border-zinc-700 cursor-pointer ${
                      activeDatabaseConnection === conn.id ? 'border-zinc-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        conn.isConnected ? 'bg-white' : 'bg-zinc-600'
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
                        className="text-xs text-zinc-500 hover:text-red-400"
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
          <div className="p-3 space-y-3">
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
          <div className="p-3">
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
                    {queryResults.rows.map((row, index) => (
                      <div key={index} className="flex border-b border-zinc-800 last:border-b-0">
                        {Object.values(row).map((value, i) => (
                          <div key={i} className="flex-1 px-3 py-2 text-xs text-white border-r border-zinc-800 last:border-r-0">
                            {String(value)}
                          </div>
                        ))}
                      </div>
                    ))}
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

export function APIPanel() {
  const { 
    apiRequests, 
    activeApiRequest, 
    addApiRequest, 
    setActiveApiRequest,
    deleteApiRequest,
    updateApiRequest
  } = useIDEStore()
  
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
  const [response, setResponse] = useState<{status: number, data: any, time: number} | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
  }

  const sendRequest = async () => {
    const activeReq = apiRequests.find(req => req.id === activeApiRequest)
    if (!activeReq) return

    setIsLoading(true)
    const startTime = Date.now()

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500))
      
      const mockResponse = {
        status: 200,
        data: {
          message: 'Success',
          timestamp: new Date().toISOString(),
          data: { id: 1, name: 'Sample Data' }
        },
        time: Date.now() - startTime
      }
      
      setResponse(mockResponse)
    } catch (error) {
      setResponse({
        status: 500,
        data: { error: 'Request failed' },
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

  const activeRequest = apiRequests.find(req => req.id === activeApiRequest)

  return (
    <div className="flex flex-col h-full">
      <div className="h-10 px-4 flex items-center justify-between shrink-0">
        <span className="label">API</span>
        <button 
          onClick={createRequest}
          className="text-xs text-zinc-600 hover:text-white"
        >
          <i className="ph ph-plus"></i>
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* New Request Form */}
        <div className="p-3 border-b border-zinc-800 space-y-2">
          <input
            type="text"
            placeholder="Request name"
            value={newRequest.name}
            onChange={(e) => setNewRequest(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-black/50 border-line rounded px-2 py-1 text-xs text-white"
          />
          <div className="flex gap-2">
            <select
              value={newRequest.method}
              onChange={(e) => setNewRequest(prev => ({ ...prev, method: e.target.value as any }))}
              className="bg-black/50 border-line rounded px-2 py-1 text-xs text-white"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              placeholder="https://api.example.com"
              value={newRequest.url}
              onChange={(e) => setNewRequest(prev => ({ ...prev, url: e.target.value }))}
              className="flex-1 bg-black/50 border-line rounded px-2 py-1 text-xs text-white"
            />
          </div>
        </div>

        {/* Request List */}
        <div className="p-3 border-b border-zinc-800 max-h-32 overflow-y-auto">
          <div className="space-y-1">
            {apiRequests.map(request => (
              <div 
                key={request.id}
                onClick={() => setActiveApiRequest(request.id)}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                  activeApiRequest === request.id ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span className={`px-1 py-0.5 text-[8px] font-bold rounded ${
                  request.method === 'GET' ? 'bg-green-600' :
                  request.method === 'POST' ? 'bg-blue-600' :
                  request.method === 'PUT' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {request.method}
                </span>
                <span className="text-xs text-white flex-1 truncate">{request.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteApiRequest(request.id)
                  }}
                  className="text-xs text-zinc-600 hover:text-red-400"
                >
                  <i className="ph ph-x"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Request Details */}
        {activeRequest && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  activeRequest.method === 'GET' ? 'bg-green-600' :
                  activeRequest.method === 'POST' ? 'bg-blue-600' :
                  activeRequest.method === 'PUT' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {activeRequest.method}
                </span>
                <span className="text-xs text-white font-mono flex-1">{activeRequest.url}</span>
              </div>
              <button 
                onClick={sendRequest}
                disabled={isLoading}
                className="btn-primary text-xs w-full disabled:opacity-50"
              >
                {isLoading ? (
                  <><i className="ph ph-spinner animate-spin mr-2"></i>Sending...</>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {['params', 'headers', 'body', 'response'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-3 py-2 text-xs font-semibold capitalize transition ${
                    activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-zinc-600 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'params' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Query Parameters</span>
                    <button onClick={addParam} className="text-xs text-blue-400 hover:text-blue-300">
                      <i className="ph ph-plus"></i>
                    </button>
                  </div>
                  {params.map((param, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="checkbox" checked={param.enabled} className="w-3 h-3" />
                      <input 
                        placeholder="Key" 
                        value={param.key}
                        className="flex-1 bg-black/50 border-line rounded px-2 py-1 text-xs text-white"
                      />
                      <input 
                        placeholder="Value" 
                        value={param.value}
                        className="flex-1 bg-black/50 border-line rounded px-2 py-1 text-xs text-white"
                      />
                      <button className="text-xs text-red-400"><i className="ph ph-trash"></i></button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'headers' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Headers</span>
                    <button onClick={addHeader} className="text-xs text-blue-400 hover:text-blue-300">
                      <i className="ph ph-plus"></i>
                    </button>
                  </div>
                  {headers.map((header, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input 
                        type="checkbox" 
                        checked={header.enabled} 
                        onChange={(e) => {
                          const newHeaders = [...headers]
                          newHeaders[i].enabled = e.target.checked
                          setHeaders(newHeaders)
                        }}
                        className="w-3 h-3" 
                      />
                      <input 
                        placeholder="Key" 
                        value={header.key}
                        onChange={(e) => {
                          const newHeaders = [...headers]
                          newHeaders[i].key = e.target.value
                          setHeaders(newHeaders)
                        }}
                        className="flex-1 bg-black/50 border-line rounded px-2 py-1 text-xs text-white"
                      />
                      <input 
                        placeholder="Value" 
                        value={header.value}
                        onChange={(e) => {
                          const newHeaders = [...headers]
                          newHeaders[i].value = e.target.value
                          setHeaders(newHeaders)
                        }}
                        className="flex-1 bg-black/50 border-line rounded px-2 py-1 text-xs text-white"
                      />
                      <button 
                        onClick={() => setHeaders(headers.filter((_, idx) => idx !== i))}
                        className="text-xs text-red-400"
                      >
                        <i className="ph ph-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'body' && (
                <div className="space-y-2">
                  <span className="text-xs text-zinc-400">Request Body</span>
                  <textarea 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full h-32 bg-black/50 border-line rounded p-2 text-xs text-white font-mono resize-none"
                  />
                </div>
              )}

              {activeTab === 'response' && (
                <div className="space-y-2">
                  {response ? (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded font-bold ${
                          response.status < 300 ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {response.status}
                        </span>
                        <span className="text-zinc-400">{response.time}ms</span>
                      </div>
                      <pre className="bg-black/50 border-line rounded p-2 text-xs text-white font-mono overflow-auto max-h-48">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </>
                  ) : (
                    <div className="text-xs text-zinc-600 text-center py-8">
                      Send a request to see the response
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}