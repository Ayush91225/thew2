'use client'

import { useState, useEffect } from 'react'
import { useIDEStore } from '@/stores/ide-store'

interface Deployment {
  id: string
  environment: 'development' | 'staging' | 'production'
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed'
  branch: string
  commit: string
  timestamp: Date
  duration?: number
  url?: string
}

interface BuildStep {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: number
}

export default function DeploymentDashboard() {
  const { view, gitBranch } = useIDEStore()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [currentBuild, setCurrentBuild] = useState<BuildStep[]>([])
  const [isDeploying, setIsDeploying] = useState(false)

  useEffect(() => {
    if (view === 'deploy') {
      setDeployments([
        {
          id: '1',
          environment: 'production',
          status: 'success',
          branch: 'main',
          commit: '7f8a9b2',
          timestamp: new Date(Date.now() - 3600000),
          duration: 142,
          url: 'https://kriya-ide.vercel.app'
        },
        {
          id: '2',
          environment: 'staging',
          status: 'success',
          branch: 'develop',
          commit: 'a1b2c3d',
          timestamp: new Date(Date.now() - 7200000),
          duration: 98,
          url: 'https://staging.kriya-ide.vercel.app'
        },
        {
          id: '3',
          environment: 'development',
          status: 'failed',
          branch: 'feature/new-ui',
          commit: 'e4f5g6h',
          timestamp: new Date(Date.now() - 10800000),
          duration: 67
        }
      ])
    }
  }, [view])

  const startDeployment = async (environment: 'development' | 'staging' | 'production') => {
    setIsDeploying(true)
    
    const buildSteps: BuildStep[] = [
      { name: 'Installing dependencies', status: 'pending' },
      { name: 'Running tests', status: 'pending' },
      { name: 'Building application', status: 'pending' },
      { name: 'Optimizing assets', status: 'pending' },
      { name: 'Deploying to CDN', status: 'pending' },
      { name: 'Updating DNS', status: 'pending' }
    ]
    
    setCurrentBuild(buildSteps)

    const newDeployment: Deployment = {
      id: Date.now().toString(),
      environment,
      status: 'building',
      branch: gitBranch,
      commit: Math.random().toString(36).substring(7),
      timestamp: new Date()
    }

    setDeployments(prev => [newDeployment, ...prev])

    for (let i = 0; i < buildSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      setCurrentBuild(prev => prev.map((step, index) => {
        if (index === i) {
          return { ...step, status: 'running' }
        }
        return step
      }))

      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500))
      
      const shouldFail = Math.random() < 0.1 && i > 2
      
      setCurrentBuild(prev => prev.map((step, index) => {
        if (index === i) {
          return { 
            ...step, 
            status: shouldFail ? 'failed' : 'completed',
            duration: Math.floor(Math.random() * 30) + 10
          }
        }
        return step
      }))

      if (shouldFail) {
        setDeployments(prev => prev.map(dep => 
          dep.id === newDeployment.id 
            ? { ...dep, status: 'failed', duration: (Date.now() - dep.timestamp.getTime()) / 1000 }
            : dep
        ))
        setIsDeploying(false)
        return
      }
    }

    const duration = (Date.now() - newDeployment.timestamp.getTime()) / 1000
    setDeployments(prev => prev.map(dep => 
      dep.id === newDeployment.id 
        ? { 
            ...dep, 
            status: 'success', 
            duration,
            url: `https://${environment === 'production' ? '' : environment + '.'}kriya-ide.vercel.app`
          }
        : dep
    ))
    
    setIsDeploying(false)
    setCurrentBuild([])
  }

  if (view !== 'deploy') return null

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black">
      <div className="max-w-full">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-white mb-2">Deployments</h1>
            <p className="text-zinc-500 text-sm">Build and deploy your applications across environments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => startDeployment('development')}
              disabled={isDeploying}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deploy to Development
            </button>
            <button
              onClick={() => startDeployment('staging')}
              disabled={isDeploying}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deploy to Staging
            </button>
            <button
              onClick={() => startDeployment('production')}
              disabled={isDeploying}
              className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deploy to Production
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Development</h4>
              <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className="text-zinc-300">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Last Deploy</span>
                <span className="text-zinc-400">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Branch</span>
                <span className="text-zinc-400 font-mono">develop</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Build</span>
                <span className="text-zinc-400">#1247</span>
              </div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Staging</h4>
              <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className="text-zinc-300">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Last Deploy</span>
                <span className="text-zinc-400">4 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Branch</span>
                <span className="text-zinc-400 font-mono">develop</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Build</span>
                <span className="text-zinc-400">#1245</span>
              </div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Production</h4>
              <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className="text-zinc-300">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Last Deploy</span>
                <span className="text-zinc-400">1 hour ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Branch</span>
                <span className="text-zinc-400 font-mono">main</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Build</span>
                <span className="text-zinc-400">#1246</span>
              </div>
            </div>
          </div>
        </div>

        {isDeploying && currentBuild.length > 0 && (
          <div className="border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-medium text-white">Build in Progress</h3>
            </div>
            
            <div className="space-y-3">
              {currentBuild.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {step.status === 'completed' && <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>}
                    {step.status === 'running' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                    {step.status === 'failed' && <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>}
                    {step.status === 'pending' && <div className="w-2 h-2 bg-zinc-800 rounded-full"></div>}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-zinc-300' :
                      step.status === 'running' ? 'text-white' :
                      step.status === 'failed' ? 'text-zinc-500' :
                      'text-zinc-600'
                    }`}>
                      {step.name}
                    </div>
                    {step.duration && (
                      <div className="text-xs text-zinc-500 mt-1">{step.duration}s</div>
                    )}
                  </div>
                  
                  <div className="text-xs text-zinc-500">
                    {step.status === 'running' && 'Running'}
                    {step.status === 'completed' && 'Done'}
                    {step.status === 'failed' && 'Failed'}
                    {step.status === 'pending' && 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
            <h3 className="text-sm font-medium text-white mb-1">Deployment History</h3>
            <p className="text-xs text-zinc-500">Recent deployments across all environments</p>
          </div>
          
          <div className="divide-y divide-zinc-800">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="p-4 hover:bg-zinc-900/30 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      deployment.status === 'success' ? 'bg-zinc-400' :
                      deployment.status === 'failed' ? 'bg-zinc-600' :
                      deployment.status === 'building' ? 'bg-white animate-pulse' :
                      'bg-zinc-800'
                    }`}></div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-white">
                          {deployment.branch}
                        </span>
                        <span className="text-xs font-mono text-zinc-500 border border-zinc-800 px-2 py-1 rounded">
                          {deployment.environment.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-600 font-mono">
                          #{deployment.commit}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-xs text-zinc-500">
                        <div>
                          <span className="text-zinc-600">Deployed</span>
                          <div className="text-zinc-400">{deployment.timestamp.toLocaleString()}</div>
                        </div>
                        {deployment.duration && (
                          <div>
                            <span className="text-zinc-600">Duration</span>
                            <div className="text-zinc-400">{Math.floor(deployment.duration)}s</div>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-600">Status</span>
                          <div className={`${
                            deployment.status === 'success' ? 'text-zinc-300' :
                            deployment.status === 'failed' ? 'text-zinc-500' :
                            deployment.status === 'building' ? 'text-white' :
                            'text-zinc-600'
                          }`}>
                            {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                          </div>
                        </div>
                        {deployment.url && (
                          <div>
                            <span className="text-zinc-600">URL</span>
                            <div>
                              <a 
                                href={deployment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-white transition underline"
                              >
                                View Live
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {deployment.status === 'success' && (
                      <button className="px-3 py-1 text-xs font-medium text-zinc-400 border border-zinc-800 rounded hover:text-white hover:border-zinc-700 transition">
                        Rollback
                      </button>
                    )}
                    <button className="px-3 py-1 text-xs font-medium text-zinc-400 border border-zinc-800 rounded hover:text-white hover:border-zinc-700 transition">
                      Logs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}