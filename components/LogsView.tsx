'use client'

import { useState } from 'react'

export default function LogsView() {
  const [logLevel, setLogLevel] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState('1h')

  const logs = [
    { id: 1, timestamp: '2024-01-20T14:32:15.234Z', level: 'INFO', service: 'api-gateway', message: 'Request processed successfully', requestId: 'req_abc123', duration: '127ms', statusCode: 200 },
    { id: 2, timestamp: '2024-01-20T14:32:16.891Z', level: 'WARN', service: 'auth-service', message: 'Rate limit approaching for user', requestId: 'req_def456', userId: 'user_789', remaining: '5/100' },
    { id: 3, timestamp: '2024-01-20T14:32:17.456Z', level: 'ERROR', service: 'payment-service', message: 'Payment processing failed: Invalid card number', requestId: 'req_ghi789', errorCode: 'INVALID_CARD', amount: '$99.99' },
    { id: 4, timestamp: '2024-01-20T14:32:18.123Z', level: 'INFO', service: 'database', message: 'Connection pool health check passed', connections: '45/100', latency: '12ms' },
    { id: 5, timestamp: '2024-01-20T14:32:19.789Z', level: 'DEBUG', service: 'cache-service', message: 'Cache hit for key user_session_xyz', key: 'user_session_xyz', ttl: '3600s' },
    { id: 6, timestamp: '2024-01-20T14:32:20.345Z', level: 'ERROR', service: 'notification-service', message: 'Failed to send email notification', requestId: 'req_jkl012', recipient: 'user@example.com', error: 'SMTP timeout' }
  ]

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }) + '.' + date.getMilliseconds().toString().padStart(3, '0')
  }

  return (
    <div className="flex-1 bg-black overflow-y-auto">
      <div className="p-6 max-w-full">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-white mb-2">Application Logs</h1>
          <p className="text-zinc-500 text-sm">Real-time application logs, system events, and error tracking across all services</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-500">Level:</label>
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="ERROR">Error Only</option>
              <option value="WARN">Warning & Above</option>
              <option value="INFO">Info & Above</option>
              <option value="DEBUG">Debug & Above</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-500">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none"
            >
              <option value="5m">Last 5 minutes</option>
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search logs by message, service, or request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-sm hover:bg-zinc-700 hover:text-white transition">
              <i className="ph ph-download-simple mr-2"></i>
              Export
            </button>
            
            <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-sm hover:bg-zinc-700 hover:text-white transition">
              <i className="ph ph-trash mr-2"></i>
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Total Events</div>
            <div className="text-2xl font-mono text-white mb-1">24,847</div>
            <div className="text-xs text-zinc-400">Last 24 hours</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Errors</div>
            <div className="text-2xl font-mono text-white mb-1">127</div>
            <div className="text-xs text-zinc-400">0.51% of total</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Warnings</div>
            <div className="text-2xl font-mono text-white mb-1">1,456</div>
            <div className="text-xs text-zinc-400">5.86% of total</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Info</div>
            <div className="text-2xl font-mono text-white mb-1">21,234</div>
            <div className="text-xs text-zinc-400">85.46% of total</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Debug</div>
            <div className="text-2xl font-mono text-white mb-1">2,030</div>
            <div className="text-xs text-zinc-400">8.17% of total</div>
          </div>
        </div>

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Live Log Stream</h3>
              <p className="text-xs text-zinc-500">Real-time application logs with filtering and search capabilities</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-zinc-400 font-mono">STREAMING</span>
            </div>
          </div>
          
          <div className="font-mono">
            <div className="grid grid-cols-12 gap-4 p-3 border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-medium">
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-1">Level</div>
              <div className="col-span-2">Service</div>
              <div className="col-span-1">Request ID</div>
              <div className="col-span-6">Message & Details</div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="grid grid-cols-12 gap-4 p-3 border-b border-zinc-800 hover:bg-zinc-900/30 transition text-xs">
                  <div className="col-span-2 text-zinc-400 font-mono">
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${
                      log.level === 'ERROR' ? 'text-zinc-300 border-zinc-700 bg-zinc-800' :
                      log.level === 'WARN' ? 'text-zinc-400 border-zinc-800 bg-zinc-900' :
                      log.level === 'INFO' ? 'text-zinc-500 border-zinc-800 bg-zinc-900' :
                      'text-zinc-600 border-zinc-800 bg-zinc-900'
                    }`}>
                      {log.level}
                    </span>
                  </div>
                  <div className="col-span-2 text-zinc-300 font-medium">
                    {log.service}
                  </div>
                  <div className="col-span-1 text-zinc-500 font-mono text-[10px]">
                    {log.requestId?.replace('req_', '')}
                  </div>
                  <div className="col-span-6">
                    <div className="text-zinc-200 mb-1">{log.message}</div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {log.duration && (
                        <span className="text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded">
                          Duration: {log.duration}
                        </span>
                      )}
                      {log.statusCode && (
                        <span className="text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded">
                          Status: {log.statusCode}
                        </span>
                      )}
                      {log.errorCode && (
                        <span className="text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">
                          Error: {log.errorCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}