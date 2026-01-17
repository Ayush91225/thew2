'use client'

import { useIDEStore } from '@/stores/ide-store'
import { X, FolderOpen, Rocket, ChartBar, Database, FileText, Activity } from 'phosphor-react'
import { useState } from 'react'

const settingsCategories = [
  { id: 'workspace', name: 'Workspace', icon: FolderOpen },
  { id: 'deployments', name: 'Deployments', icon: Rocket },
  { id: 'analytics', name: 'Analytics', icon: ChartBar },
  { id: 'database', name: 'Database', icon: Database },
  { id: 'logs', name: 'Logs', icon: FileText },
  { id: 'monitoring', name: 'Monitoring', icon: Activity }
]

export default function SettingsPanel() {
  const { settingsOpen, setSettingsOpen } = useIDEStore()
  const [activeCategory, setActiveCategory] = useState('workspace')

  if (!settingsOpen) return null

  return (
    <div className="w-96 border-l border-gray-800 bg-black flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-gray-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Settings</span>
        </div>
        <button 
          onClick={() => setSettingsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-800 bg-gray-950">
          <div className="p-4">
            <div className="space-y-1">
              {settingsCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                      activeCategory === category.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <IconComponent size={16} />
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderCategoryContent(activeCategory)}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderCategoryContent(categoryId: string) {
  switch (categoryId) {
    case 'workspace':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Workspace Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                  <input type="text" defaultValue="kriya-ide" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Branch</label>
                  <input type="text" defaultValue="main" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Root Directory</label>
                <input type="text" defaultValue="/" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="autoSave" defaultChecked className="rounded" />
                <label htmlFor="autoSave" className="text-sm text-gray-300">Auto-save files</label>
              </div>
            </div>
          </div>
        </div>
      )

    case 'deployments':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Deployment Configuration</h3>
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Build Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Build Command</label>
                    <input type="text" defaultValue="npm run build" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Output Directory</label>
                    <input type="text" defaultValue="dist" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Environment</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Node.js Version</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white">
                      <option>18.x</option>
                      <option>20.x</option>
                      <option>16.x</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoDeployment" defaultChecked className="rounded" />
                    <label htmlFor="autoDeployment" className="text-sm text-gray-300">Auto-deploy on push to main</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'analytics':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Analytics & Insights</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Build Time</span>
                    <span className="text-sm text-white">2.3s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Bundle Size</span>
                    <span className="text-sm text-white">1.2MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Load Time</span>
                    <span className="text-sm text-white">0.8s</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Usage Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Daily Active Users</span>
                    <span className="text-sm text-white">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Page Views</span>
                    <span className="text-sm text-white">5,678</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Bounce Rate</span>
                    <span className="text-sm text-white">12%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'database':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Database Configuration</h3>
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Connection Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Database URL</label>
                    <input type="text" placeholder="postgresql://user:pass@host:port/db" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Max Connections</label>
                      <input type="number" defaultValue="10" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Timeout (ms)</label>
                      <input type="number" defaultValue="5000" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Migration Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoMigrate" className="rounded" />
                    <label htmlFor="autoMigrate" className="text-sm text-gray-300">Auto-run migrations on deploy</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="seedData" className="rounded" />
                    <label htmlFor="seedData" className="text-sm text-gray-300">Seed development data</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'logs':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Logging Configuration</h3>
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Log Levels</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Minimum Log Level</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white">
                      <option>Error</option>
                      <option>Warn</option>
                      <option>Info</option>
                      <option>Debug</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="structuredLogs" defaultChecked className="rounded" />
                    <label htmlFor="structuredLogs" className="text-sm text-gray-300">Structured JSON logging</label>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Retention Policy</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Retention Period</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white">
                      <option>7 days</option>
                      <option>30 days</option>
                      <option>90 days</option>
                      <option>1 year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Max Size (GB)</label>
                    <input type="number" defaultValue="10" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'monitoring':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Monitoring & Alerts</h3>
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Health Checks</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Health Check URL</label>
                    <input type="text" defaultValue="/api/health" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Check Interval (s)</label>
                      <input type="number" defaultValue="30" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Timeout (s)</label>
                      <input type="number" defaultValue="10" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Alert Thresholds</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">CPU Usage (%)</label>
                      <input type="number" defaultValue="80" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Memory Usage (%)</label>
                      <input type="number" defaultValue="85" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Error Rate (%)</label>
                    <input type="number" defaultValue="5" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return <div className="text-gray-400">Select a category to view settings</div>
  }
}