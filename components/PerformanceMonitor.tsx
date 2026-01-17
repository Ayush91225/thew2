'use client'

import { useEffect, useState } from 'react'
import { useIDEStore } from '@/stores/ide-store'

interface PerformanceMetrics {
  cpu: number
  memory: number
  buildTime: number
  bundleSize: number
  loadTime: number
  errorRate: number
}

export default function PerformanceMonitor() {
  const { 
    view, 
    cpuUsage, 
    memoryUsage, 
    buildTime, 
    updateMetrics 
  } = useIDEStore()
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cpu: cpuUsage,
    memory: memoryUsage,
    buildTime,
    bundleSize: 2.4,
    loadTime: 1.2,
    errorRate: 0.1
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    if (view === 'monitoring') {
      setIsMonitoring(true)
      const interval = setInterval(() => {
        const newMetrics = {
          cpu: Math.max(10, Math.min(90, cpuUsage + (Math.random() - 0.5) * 10)),
          memory: Math.max(20, Math.min(95, memoryUsage + (Math.random() - 0.5) * 8)),
          buildTime: Math.max(0.5, buildTime + (Math.random() - 0.5) * 0.5),
          bundleSize: Math.max(1.0, 2.4 + (Math.random() - 0.5) * 0.2),
          loadTime: Math.max(0.3, 1.2 + (Math.random() - 0.5) * 0.3),
          errorRate: Math.max(0, Math.min(5, 0.1 + (Math.random() - 0.5) * 0.2))
        }
        
        setMetrics(newMetrics)
        updateMetrics({
          cpu: newMetrics.cpu,
          memory: newMetrics.memory,
          buildTime: newMetrics.buildTime
        })
      }, 2000)

      return () => {
        clearInterval(interval)
        setIsMonitoring(false)
      }
    }
  }, [view, cpuUsage, memoryUsage, buildTime, updateMetrics])

  if (view !== 'monitoring') return null

  return (
    <div className="flex-1 bg-black overflow-y-auto">
      <div className="p-6 max-w-6xl">
        
        <div className="mb-6">
          <h1 className="text-lg font-medium text-white mb-2">Performance Monitoring</h1>
          <p className="text-zinc-500 text-sm">Real-time application performance metrics</p>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">CPU</div>
            <div className="text-2xl font-mono text-white mb-1">{metrics.cpu.toFixed(1)}%</div>
            <div className="w-full bg-zinc-800 rounded-full h-1">
              <div className="bg-zinc-400 h-1 rounded-full transition-all" style={{ width: `${metrics.cpu}%` }}></div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Memory</div>
            <div className="text-2xl font-mono text-white mb-1">{metrics.memory.toFixed(1)}%</div>
            <div className="w-full bg-zinc-800 rounded-full h-1">
              <div className="bg-zinc-400 h-1 rounded-full transition-all" style={{ width: `${metrics.memory}%` }}></div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Build</div>
            <div className="text-2xl font-mono text-white mb-1">{metrics.buildTime.toFixed(1)}s</div>
            <div className="text-xs text-zinc-400">Last compilation</div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Bundle</div>
            <div className="text-2xl font-mono text-white mb-1">{metrics.bundleSize.toFixed(1)}MB</div>
            <div className="text-xs text-zinc-400">Compressed size</div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Load</div>
            <div className="text-2xl font-mono text-white mb-1">{metrics.loadTime.toFixed(1)}s</div>
            <div className="text-xs text-zinc-400">Initial page load</div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Errors</div>
            <div className="text-2xl font-mono text-white mb-1">{metrics.errorRate.toFixed(2)}%</div>
            <div className="text-xs text-zinc-400">Runtime errors</div>
          </div>
        </div>

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Performance Status</h3>
              <p className="text-xs text-zinc-500">Real-time monitoring of application metrics</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-zinc-400 animate-pulse' : 'bg-zinc-600'}`}></div>
              <span className="text-xs text-zinc-400 font-mono">{isMonitoring ? 'LIVE' : 'OFFLINE'}</span>
            </div>
          </div>
          
          <div className="font-mono">
            <div className="grid grid-cols-5 gap-4 p-3 border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-medium">
              <div>Metric</div>
              <div>Current</div>
              <div>Threshold</div>
              <div>Status</div>
              <div>Trend</div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {[
                { metric: 'CPU Usage', current: `${metrics.cpu.toFixed(1)}%`, threshold: '< 70%', status: metrics.cpu < 70 ? 'OK' : 'HIGH', trend: '+2.1%' },
                { metric: 'Memory Usage', current: `${metrics.memory.toFixed(1)}%`, threshold: '< 80%', status: metrics.memory < 80 ? 'OK' : 'HIGH', trend: '+1.5%' },
                { metric: 'Build Time', current: `${metrics.buildTime.toFixed(1)}s`, threshold: '< 5s', status: metrics.buildTime < 5 ? 'OK' : 'SLOW', trend: '-0.3s' },
                { metric: 'Bundle Size', current: `${metrics.bundleSize.toFixed(1)}MB`, threshold: '< 3MB', status: metrics.bundleSize < 3 ? 'OK' : 'LARGE', trend: '+0.1MB' },
                { metric: 'Load Time', current: `${metrics.loadTime.toFixed(1)}s`, threshold: '< 2s', status: metrics.loadTime < 2 ? 'OK' : 'SLOW', trend: '-0.2s' },
                { metric: 'Error Rate', current: `${metrics.errorRate.toFixed(2)}%`, threshold: '< 1%', status: metrics.errorRate < 1 ? 'OK' : 'HIGH', trend: '-0.05%' }
              ].map(item => (
                <div key={item.metric} className="grid grid-cols-5 gap-4 p-3 border-b border-zinc-800 hover:bg-zinc-900/30 transition text-xs">
                  <div className="text-zinc-300 font-medium">{item.metric}</div>
                  <div className="text-zinc-400 font-mono">{item.current}</div>
                  <div className="text-zinc-400 font-mono">{item.threshold}</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${
                      item.status === 'OK' ? 'text-zinc-300 border-zinc-700 bg-zinc-800' :
                      'text-zinc-400 border-zinc-800 bg-zinc-900'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-zinc-400 font-mono">{item.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}