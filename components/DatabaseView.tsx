'use client'

import { useState } from 'react'

export default function DatabaseView() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="flex-1 bg-black overflow-y-auto">
      <div className="border-b border-zinc-800">
        <div className="flex items-center gap-6 px-6 py-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'query' ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Query Editor
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Database</h1>
              <p className="text-zinc-500 text-sm">Manage your database connections and data</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                  <span className="text-sm font-medium text-white">PostgreSQL</span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">Production Database</p>
                <div className="text-xs text-zinc-500">Connected • 45ms latency</div>
              </div>
              
              <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                  <span className="text-sm font-medium text-white">Redis</span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">Cache Layer</p>
                <div className="text-xs text-zinc-500">Connected • 12ms latency</div>
              </div>
              
              <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                  <span className="text-sm font-medium text-white">MongoDB</span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">Analytics DB</p>
                <div className="text-xs text-zinc-500">Disconnected</div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
                <h3 className="text-sm font-medium text-white mb-1">Database Statistics</h3>
                <p className="text-xs text-zinc-500">Storage usage and connection metrics</p>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-zinc-300">Storage Used</span>
                      <span className="text-sm text-white font-medium">2.4 GB / 10 GB</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className="bg-zinc-400 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-zinc-300">Connections</span>
                      <span className="text-sm text-white font-medium">12 / 100</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className="bg-zinc-400 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-white mb-2">Query Editor</h1>
                <p className="text-zinc-500 text-sm">Execute SQL queries against your database</p>
              </div>
              <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition">
                Run Query
              </button>
            </div>
            
            <div className="border border-zinc-800 rounded-lg p-4">
              <textarea
                className="w-full h-32 bg-zinc-950 text-white font-mono text-sm p-3 rounded border border-zinc-800 resize-none focus:border-white focus:outline-none"
                placeholder="SELECT * FROM users WHERE created_at > '2024-01-01';"
                defaultValue="SELECT * FROM users WHERE created_at > '2024-01-01';"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}