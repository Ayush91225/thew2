'use client'

export default function AnalyticsView() {
  return (
    <div className="flex-1 bg-black overflow-y-auto">
      <div className="p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-white mb-2">Analytics</h1>
          <p className="text-zinc-500 text-sm">Application metrics and performance monitoring</p>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Requests</div>
            <div className="text-2xl font-mono text-white mb-1">2,847</div>
            <div className="text-xs text-zinc-400">+12.3% from last hour</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Errors</div>
            <div className="text-2xl font-mono text-white mb-1">127</div>
            <div className="text-xs text-zinc-400">0.51% of total</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Latency</div>
            <div className="text-2xl font-mono text-white mb-1">127ms</div>
            <div className="text-xs text-zinc-400">P95 response time</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">CPU</div>
            <div className="text-2xl font-mono text-white mb-1">23.1%</div>
            <div className="text-xs text-zinc-400">Average usage</div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Memory</div>
            <div className="text-2xl font-mono text-white mb-1">67.3%</div>
            <div className="text-xs text-zinc-400">Current usage</div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Uptime</div>
            <div className="text-2xl font-mono text-white mb-1">99.98%</div>
            <div className="text-xs text-zinc-400">Last 30 days</div>
          </div>
        </div>

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Service Status</h3>
              <p className="text-xs text-zinc-500">Real-time health monitoring of all services</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-zinc-400 font-mono">LIVE</span>
            </div>
          </div>
          
          <div className="font-mono">
            <div className="grid grid-cols-6 gap-4 p-3 border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-medium">
              <div>Service</div>
              <div>Status</div>
              <div>Latency</div>
              <div>CPU</div>
              <div>Memory</div>
              <div>Uptime</div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {[
                { service: 'API Gateway', status: 'UP', latency: '12ms', cpu: '15%', mem: '45%', uptime: '99.99%' },
                { service: 'Database', status: 'UP', latency: '8ms', cpu: '32%', mem: '67%', uptime: '99.95%' },
                { service: 'Redis Cache', status: 'UP', latency: '2ms', cpu: '8%', mem: '23%', uptime: '99.99%' },
                { service: 'CDN Edge', status: 'DEGRADED', latency: '45ms', cpu: '78%', mem: '89%', uptime: '98.12%' },
                { service: 'Queue', status: 'UP', latency: '15ms', cpu: '12%', mem: '34%', uptime: '99.97%' },
                { service: 'Auth Service', status: 'UP', latency: '18ms', cpu: '25%', mem: '56%', uptime: '99.94%' },
                { service: 'File Storage', status: 'UP', latency: '22ms', cpu: '19%', mem: '41%', uptime: '99.98%' },
                { service: 'WebSocket', status: 'UP', latency: '5ms', cpu: '11%', mem: '28%', uptime: '99.99%' }
              ].map(item => (
                <div key={item.service} className="grid grid-cols-6 gap-4 p-3 border-b border-zinc-800 hover:bg-zinc-900/30 transition text-xs">
                  <div className="text-zinc-300 font-medium">{item.service}</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${
                      item.status === 'UP' ? 'text-zinc-300 border-zinc-700 bg-zinc-800' :
                      'text-zinc-400 border-zinc-800 bg-zinc-900'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-zinc-400 font-mono">{item.latency}</div>
                  <div className="text-zinc-400 font-mono">{item.cpu}</div>
                  <div className="text-zinc-400 font-mono">{item.mem}</div>
                  <div className="text-zinc-400 font-mono">{item.uptime}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}