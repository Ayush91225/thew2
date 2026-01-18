'use client'

import { useState } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'
import FileCreator from './FileCreator'
import FolderCreator from './FolderCreator'

export default function SettingsView() {
  const [activeCategory, setActiveCategory] = useState('workspace')
  const [newPrompt, setNewPrompt] = useState('')
  
  // Workspace state
  const [projectName, setProjectName] = useState('kriya-ide')
  const [rootDirectory, setRootDirectory] = useState('/workspace')
  const [defaultBranch, setDefaultBranch] = useState('main')
  const [formatOnSave, setFormatOnSave] = useState(true)
  const [nodeVersion, setNodeVersion] = useState('20.x LTS (Recommended)')
  const [packageManager, setPackageManager] = useState('npm')
  const [tsConfig, setTsConfig] = useState('Strict')
  
  const { 
    autoSave, setAutoSave, 
    aiEnabled, setAiEnabled, aiModel, setAiModel, aiTemperature, setAiTemperature,
    aiMaxTokens, setAiMaxTokens, aiAutoComplete, setAiAutoComplete, aiCodeSuggestions, setAiCodeSuggestions,
    aiErrorAnalysis, setAiErrorAnalysis, aiDocGeneration, setAiDocGeneration, aiPrivacyMode, setAiPrivacyMode,
    aiCustomPrompts, addCustomPrompt, removeCustomPrompt, testAiConnection,
    defaultLanguage, setDefaultLanguage,
    setLanguageFormatter, setLanguageLinter, resetLanguageSettings,
    debugAutoStart, debugPort, debugConsole, debugBreakOnExceptions,
    setDebugAutoStart, setDebugPort, setDebugConsole, setDebugBreakOnExceptions,
  } = useIDEStore()

  // Workspace action handlers
  const handleOpenWorkspace = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = (e: any) => {
      const files = e.target.files
      if (files.length > 0) {
        const path = files[0].webkitRelativePath.split('/')[0]
        setRootDirectory(`/workspace/${path}`)
        alert(`Workspace "${path}" opened successfully!`)
      }
    }
    input.click()
  }

  const handleInitGit = async () => {
    alert(`Git repository initialized with branch "${defaultBranch}"!`)
  }

  const handleInstallDeps = async () => {
    alert(`Installing dependencies with ${packageManager}...\n\nThis would run: ${packageManager} install`)
  }

  const handleStartServer = async () => {
    alert(`Development server started!\n\nNode.js: ${nodeVersion}\nPackage Manager: ${packageManager}\nRunning on: http://localhost:3000`)
  }

  // File and folder creation handlers
  const handleFileCreate = async (name: string, type: string, content?: string) => {
    try {
      console.log('Creating file:', { name, type, content })
      alert(`File "${name}" created successfully!`)
    } catch (error) {
      console.error('Failed to create file:', error)
      alert('Failed to create file')
    }
  }

  const handleFolderCreate = async (name: string, template?: string) => {
    try {
      console.log('Creating folder:', { name, template })
      alert(` Folder "${name}" created successfully!\n\nTemplate: ${template || 'empty'}\n\nThis is a simulation. In production, this would create an actual folder.`)
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert(' Failed to create folder')
    }
  }

  const VALID_CATEGORIES = ['workspace', 'git', 'security', 'deployment', 'collaboration', 'ai', 'languages', 'debugging']
  
  const categories = [
    { id: 'workspace', name: 'Workspace' },
    { id: 'git', name: 'Git & VCS' },
    { id: 'security', name: 'Security' },
    { id: 'deployment', name: 'Deployment' },
    { id: 'collaboration', name: 'Collaboration' },
    { id: 'ai', name: 'AI Assistant' },
    { id: 'languages', name: 'Languages' },
    { id: 'debugging', name: 'Debugging' }
  ]

  return (
    <div className="flex-1 bg-black overflow-y-auto">
      <div className="border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-2 px-6 py-4 overflow-x-auto scrollbar-hide">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-lg ${
                activeCategory === category.id 
                  ? 'bg-white text-black' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-6xl">
        {activeCategory === 'workspace' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Workspace Settings</h1>
              <p className="text-zinc-500 text-sm">Configure workspace and project settings</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Project Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Project Name</label>
                    <input 
                      type="text" 
                      value={projectName} 
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Root Directory</label>
                    <input 
                      type="text" 
                      value={rootDirectory} 
                      onChange={(e) => setRootDirectory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Default Branch</label>
                    <input 
                      type="text" 
                      value={defaultBranch} 
                      onChange={(e) => setDefaultBranch(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none" 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="autoSaveWs" 
                      checked={autoSave} 
                      onChange={(e) => setAutoSave(e.target.checked)} 
                      className="w-4 h-4" 
                    />
                    <label htmlFor="autoSaveWs" className="text-sm text-zinc-300">Enable auto-save</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="autoFormat" 
                      checked={formatOnSave} 
                      onChange={(e) => setFormatOnSave(e.target.checked)} 
                      className="w-4 h-4" 
                    />
                    <label htmlFor="autoFormat" className="text-sm text-zinc-300">Format on save</label>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Create New File</h3>
                <FileCreator onFileCreate={handleFileCreate} />
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Create New Folder</h3>
                <FolderCreator onFolderCreate={handleFolderCreate} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Environment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Node.js Version</label>
                    <select 
                      value={nodeVersion} 
                      onChange={(e) => setNodeVersion(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none"
                    >
                      <option>20.x LTS (Recommended)</option>
                      <option>18.x LTS</option>
                      <option>16.x</option>
                      <option>14.x</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Package Manager</label>
                    <select 
                      value={packageManager} 
                      onChange={(e) => setPackageManager(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none"
                    >
                      <option>npm</option>
                      <option>yarn</option>
                      <option>pnpm</option>
                      <option>bun</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">TypeScript Config</label>
                    <select 
                      value={tsConfig} 
                      onChange={(e) => setTsConfig(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none"
                    >
                      <option>Strict</option>
                      <option>Recommended</option>
                      <option>Loose</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleOpenWorkspace}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded transition"
                  >
                    <i className="ph ph-folder-open mr-2"></i>
                    Open Workspace
                  </button>
                  <button 
                    onClick={handleInitGit}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded transition"
                  >
                    <i className="ph ph-git-branch mr-2"></i>
                    Initialize Git Repository
                  </button>
                  <button 
                    onClick={handleInstallDeps}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded transition"
                  >
                    <i className="ph ph-package mr-2"></i>
                    Install Dependencies
                  </button>
                  <button 
                    onClick={handleStartServer}
                    className="w-full bg-white hover:bg-zinc-200 text-black text-sm py-2 rounded transition font-medium"
                  >
                    <i className="ph ph-rocket mr-2"></i>
                    Start Development Server
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'git' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Git & Version Control</h1>
              <p className="text-zinc-500 text-sm">Configure Git and version control settings</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">User Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">User Name</label>
                    <input type="text" placeholder="Your Name" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Email Address</label>
                    <input type="email" placeholder="your.email@example.com" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Default Editor</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Kriya IDE</option>
                      <option>vim</option>
                      <option>nano</option>
                      <option>code</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Repository Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoFetch" defaultChecked className="w-4 h-4" />
                    <label htmlFor="autoFetch" className="text-sm text-zinc-300">Auto-fetch from remote</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="showUntracked" defaultChecked className="w-4 h-4" />
                    <label htmlFor="showUntracked" className="text-sm text-zinc-300">Show untracked files</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="confirmPush" defaultChecked className="w-4 h-4" />
                    <label htmlFor="confirmPush" className="text-sm text-zinc-300">Confirm before push</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Merge Strategy</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Merge Commit</option>
                      <option>Squash and Merge</option>
                      <option>Rebase and Merge</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'security' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Security Settings</h1>
              <p className="text-zinc-500 text-sm">Security and authentication configuration</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Authentication</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="twoFactor" className="w-4 h-4" />
                    <label htmlFor="twoFactor" className="text-sm text-zinc-300">Enable two-factor authentication</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ssoEnabled" className="w-4 h-4" />
                    <label htmlFor="ssoEnabled" className="text-sm text-zinc-300">Single Sign-On (SSO)</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Session Timeout</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>15 minutes</option>
                      <option>1 hour</option>
                      <option>8 hours</option>
                      <option>24 hours</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Password Policy</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Strong (Recommended)</option>
                      <option>Medium</option>
                      <option>Basic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Login Attempts</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>3 attempts</option>
                      <option>5 attempts</option>
                      <option>10 attempts</option>
                      <option>Unlimited</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Access Control</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ipWhitelist" className="w-4 h-4" />
                    <label htmlFor="ipWhitelist" className="text-sm text-zinc-300">Enable IP whitelist</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="apiRateLimit" defaultChecked className="w-4 h-4" />
                    <label htmlFor="apiRateLimit" className="text-sm text-zinc-300">API rate limiting</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="auditLog" defaultChecked className="w-4 h-4" />
                    <label htmlFor="auditLog" className="text-sm text-zinc-300">Enable audit logging</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="rbacEnabled" defaultChecked className="w-4 h-4" />
                    <label htmlFor="rbacEnabled" className="text-sm text-zinc-300">Role-based access control</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Encryption Level</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>AES-256 (Recommended)</option>
                      <option>AES-128</option>
                      <option>RSA-2048</option>
                      <option>RSA-4096</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Code Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="secretScanning" defaultChecked className="w-4 h-4" />
                    <label htmlFor="secretScanning" className="text-sm text-zinc-300">Secret scanning</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="dependencyCheck" defaultChecked className="w-4 h-4" />
                    <label htmlFor="dependencyCheck" className="text-sm text-zinc-300">Dependency vulnerability check</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="codeAnalysis" defaultChecked className="w-4 h-4" />
                    <label htmlFor="codeAnalysis" className="text-sm text-zinc-300">Static code analysis</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="licenseCheck" className="w-4 h-4" />
                    <label htmlFor="licenseCheck" className="text-sm text-zinc-300">License compliance check</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Security Scan Level</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>High (Recommended)</option>
                      <option>Medium</option>
                      <option>Low</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Network Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="httpsOnly" defaultChecked className="w-4 h-4" />
                    <label htmlFor="httpsOnly" className="text-sm text-zinc-300">HTTPS only</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="corsEnabled" defaultChecked className="w-4 h-4" />
                    <label htmlFor="corsEnabled" className="text-sm text-zinc-300">CORS protection</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="csrfProtection" defaultChecked className="w-4 h-4" />
                    <label htmlFor="csrfProtection" className="text-sm text-zinc-300">CSRF protection</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ddosProtection" className="w-4 h-4" />
                    <label htmlFor="ddosProtection" className="text-sm text-zinc-300">DDoS protection</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">TLS Version</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>TLS 1.3 (Recommended)</option>
                      <option>TLS 1.2</option>
                      <option>TLS 1.1</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-4">Data Protection & Compliance</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="gdprCompliance" className="w-4 h-4" />
                    <label htmlFor="gdprCompliance" className="text-sm text-zinc-300">GDPR compliance</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="dataEncryption" defaultChecked className="w-4 h-4" />
                    <label htmlFor="dataEncryption" className="text-sm text-zinc-300">Data encryption at rest</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="backupEncryption" defaultChecked className="w-4 h-4" />
                    <label htmlFor="backupEncryption" className="text-sm text-zinc-300">Encrypted backups</label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Data Retention</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>30 days</option>
                      <option>90 days</option>
                      <option>1 year</option>
                      <option>Indefinite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Backup Frequency</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Manual</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Compliance Standard</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>SOC 2 Type II</option>
                      <option>ISO 27001</option>
                      <option>HIPAA</option>
                      <option>PCI DSS</option>
                    </select>
                  </div>
                  <button className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs py-2 rounded transition border border-red-600/30">
                    Generate Security Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'deployment' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Deployment Settings</h1>
              <p className="text-zinc-500 text-sm">Configure deployment targets and CI/CD pipelines</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Cloud Providers</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Primary Provider</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>AWS</option>
                      <option>Google Cloud</option>
                      <option>Azure</option>
                      <option>Vercel</option>
                      <option>Netlify</option>
                      <option>DigitalOcean</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Default Region</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>us-east-1 (N. Virginia)</option>
                      <option>us-west-2 (Oregon)</option>
                      <option>eu-west-1 (Ireland)</option>
                      <option>ap-southeast-1 (Singapore)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Environment</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Production</option>
                      <option>Staging</option>
                      <option>Development</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoScale" defaultChecked className="w-4 h-4" />
                    <label htmlFor="autoScale" className="text-sm text-zinc-300">Enable auto-scaling</label>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">CI/CD Pipeline</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Build Tool</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>GitHub Actions</option>
                      <option>GitLab CI</option>
                      <option>Jenkins</option>
                      <option>CircleCI</option>
                      <option>Travis CI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Deploy Branch</label>
                    <input type="text" defaultValue="main" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Build Command</label>
                    <input type="text" defaultValue="npm run build" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoDeploy" defaultChecked className="w-4 h-4" />
                    <label htmlFor="autoDeploy" className="text-sm text-zinc-300">Auto-deploy on push</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="runTests" defaultChecked className="w-4 h-4" />
                    <label htmlFor="runTests" className="text-sm text-zinc-300">Run tests before deploy</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-4">Container Settings</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Container Registry</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Docker Hub</option>
                      <option>AWS ECR</option>
                      <option>Google Container Registry</option>
                      <option>Azure Container Registry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Base Image</label>
                    <input type="text" defaultValue="node:18-alpine" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Memory Limit</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>512MB</option>
                      <option>1GB</option>
                      <option>2GB</option>
                      <option>4GB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">CPU Limit</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>0.5 vCPU</option>
                      <option>1 vCPU</option>
                      <option>2 vCPU</option>
                      <option>4 vCPU</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'collaboration' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Collaboration Settings</h1>
              <p className="text-zinc-500 text-sm">Configure team collaboration and real-time editing</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Real-time Collaboration</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="liveEditing" defaultChecked className="w-4 h-4" />
                    <label htmlFor="liveEditing" className="text-sm text-zinc-300">Enable live editing</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="cursorTracking" defaultChecked className="w-4 h-4" />
                    <label htmlFor="cursorTracking" className="text-sm text-zinc-300">Show collaborator cursors</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="presenceIndicators" defaultChecked className="w-4 h-4" />
                    <label htmlFor="presenceIndicators" className="text-sm text-zinc-300">Presence indicators</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Sync Frequency</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Real-time</option>
                      <option>Every 5 seconds</option>
                      <option>Every 30 seconds</option>
                      <option>Manual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Team Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Default Role</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Editor</option>
                      <option>Viewer</option>
                      <option>Commenter</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Max Collaborators</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>5 users</option>
                      <option>10 users</option>
                      <option>25 users</option>
                      <option>Unlimited</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="guestAccess" className="w-4 h-4" />
                    <label htmlFor="guestAccess" className="text-sm text-zinc-300">Allow guest access</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="inviteLinks" defaultChecked className="w-4 h-4" />
                    <label htmlFor="inviteLinks" className="text-sm text-zinc-300">Generate invite links</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Communication</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="inlineComments" defaultChecked className="w-4 h-4" />
                    <label htmlFor="inlineComments" className="text-sm text-zinc-300">Inline comments</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="chatIntegration" className="w-4 h-4" />
                    <label htmlFor="chatIntegration" className="text-sm text-zinc-300">Integrated chat</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="voiceChat" className="w-4 h-4" />
                    <label htmlFor="voiceChat" className="text-sm text-zinc-300">Voice chat</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="notifications" defaultChecked className="w-4 h-4" />
                    <label htmlFor="notifications" className="text-sm text-zinc-300">Activity notifications</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Notification Method</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>In-app only</option>
                      <option>Email + In-app</option>
                      <option>Slack integration</option>
                      <option>Discord integration</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Version Control</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoSaveCollab" defaultChecked className="w-4 h-4" />
                    <label htmlFor="autoSaveCollab" className="text-sm text-zinc-300">Auto-save changes</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="conflictResolution" defaultChecked className="w-4 h-4" />
                    <label htmlFor="conflictResolution" className="text-sm text-zinc-300">Conflict resolution</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="changeTracking" defaultChecked className="w-4 h-4" />
                    <label htmlFor="changeTracking" className="text-sm text-zinc-300">Track all changes</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Merge Strategy</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Last writer wins</option>
                      <option>Manual resolution</option>
                      <option>Operational transform</option>
                      <option>CRDT-based</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-4">Active Collaborators</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold">JD</div>
                    <div>
                      <div className="text-sm text-white">John Doe</div>
                      <div className="text-xs text-zinc-400">john.doe@company.com • Admin</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-zinc-400">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center text-white text-xs font-bold">AS</div>
                    <div>
                      <div className="text-sm text-white">Alice Smith</div>
                      <div className="text-xs text-zinc-400">alice.smith@company.com • Editor</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-xs text-zinc-400">Away</span>
                  </div>
                </div>
                <button className="w-full p-3 border border-zinc-700 rounded text-white text-sm hover:bg-zinc-800 transition">
                  <i className="ph ph-plus mr-2"></i>
                  Invite Collaborator
                </button>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'ai' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">AI Assistant</h1>
              <p className="text-zinc-500 text-sm">Configure AI-powered coding assistance and automation</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="aiEnabled" 
                      checked={aiEnabled} 
                      onChange={(e) => setAiEnabled(e.target.checked)}
                      className="w-4 h-4" 
                    />
                    <label htmlFor="aiEnabled" className="text-sm text-zinc-300">Enable AI Assistant</label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">AI Model</label>
                    <select 
                      value={aiModel} 
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm"
                    >
                      <option>GPT-4</option>
                      <option>GPT-3.5 Turbo</option>
                      <option>Claude 3</option>
                      <option>Codex</option>
                      <option>Local Model</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Temperature: {aiTemperature}</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={aiTemperature} 
                      onChange={(e) => setAiTemperature(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Max Tokens</label>
                    <select 
                      value={aiMaxTokens} 
                      onChange={(e) => setAiMaxTokens(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value={512}>512</option>
                      <option value={1024}>1024</option>
                      <option value={2048}>2048</option>
                      <option value={4096}>4096</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="aiAutoComplete" 
                      checked={aiAutoComplete} 
                      onChange={(e) => setAiAutoComplete(e.target.checked)}
                      className="w-4 h-4" 
                    />
                    <label htmlFor="aiAutoComplete" className="text-sm text-zinc-300">Auto-completion</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="aiCodeSuggestions" 
                      checked={aiCodeSuggestions} 
                      onChange={(e) => setAiCodeSuggestions(e.target.checked)}
                      className="w-4 h-4" 
                    />
                    <label htmlFor="aiCodeSuggestions" className="text-sm text-zinc-300">Code suggestions</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="aiErrorAnalysis" 
                      checked={aiErrorAnalysis} 
                      onChange={(e) => setAiErrorAnalysis(e.target.checked)}
                      className="w-4 h-4" 
                    />
                    <label htmlFor="aiErrorAnalysis" className="text-sm text-zinc-300">Error analysis</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="aiDocGeneration" 
                      checked={aiDocGeneration} 
                      onChange={(e) => setAiDocGeneration(e.target.checked)}
                      className="w-4 h-4" 
                    />
                    <label htmlFor="aiDocGeneration" className="text-sm text-zinc-300">Documentation generation</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="aiPrivacyMode" 
                      checked={aiPrivacyMode} 
                      onChange={(e) => setAiPrivacyMode(e.target.checked)}
                      className="w-4 h-4" 
                    />
                    <label htmlFor="aiPrivacyMode" className="text-sm text-zinc-300">Privacy mode (local only)</label>
                  </div>
                  <button 
                    onClick={testAiConnection}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs py-2 rounded transition"
                  >
                    <i className="ph ph-lightning mr-1"></i>
                    Test Connection
                  </button>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Performance</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">98%</div>
                    <div className="text-xs text-zinc-400 mb-2">Accuracy</div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div className="bg-white h-1 rounded-full" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">1.2s</div>
                    <div className="text-xs text-zinc-400 mb-2">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">247</div>
                    <div className="text-xs text-zinc-400 mb-2">Requests Today</div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Code completion</span>
                      <span className="text-white">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Error fixes</span>
                      <span className="text-white">43</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Explanations</span>
                      <span className="text-white">48</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Custom Prompts</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Add custom prompt..." 
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPrompt.trim()) {
                        addCustomPrompt(newPrompt.trim())
                        setNewPrompt('')
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1 text-white text-xs w-64 focus:border-white/20 focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (newPrompt.trim()) {
                        addCustomPrompt(newPrompt.trim())
                        setNewPrompt('')
                      }
                    }}
                    className="bg-white hover:bg-zinc-200 text-black text-xs py-1 px-3 rounded transition font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {aiCustomPrompts.map((prompt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-800">
                    <span className="text-sm text-white flex-1">{prompt}</span>
                    <button 
                      onClick={() => removeCustomPrompt(index)}
                      className="text-xs text-zinc-400 hover:text-white transition ml-2"
                    >
                      <i className="ph ph-x"></i>
                    </button>
                  </div>
                ))}
                {aiCustomPrompts.length === 0 && (
                  <div className="col-span-2 text-center text-zinc-500 text-sm py-8">
                    No custom prompts added yet
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Integration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">API Endpoint</label>
                    <input 
                      type="text" 
                      placeholder="https://api.openai.com/v1" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">API Key</label>
                    <input 
                      type="password" 
                      placeholder="sk-..." 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-white/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="aiCaching" defaultChecked className="w-4 h-4" />
                    <label htmlFor="aiCaching" className="text-sm text-zinc-300">Enable response caching</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="aiAnalytics" className="w-4 h-4" />
                    <label htmlFor="aiAnalytics" className="text-sm text-zinc-300">Usage analytics</label>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">Shortcuts & Behavior</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Trigger Key</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Ctrl+Space</option>
                      <option>Tab</option>
                      <option>Ctrl+I</option>
                      <option>Alt+A</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Auto-trigger Delay</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm">
                      <option>Instant</option>
                      <option>500ms</option>
                      <option>1 second</option>
                      <option>2 seconds</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="aiContextAware" defaultChecked className="w-4 h-4" />
                    <label htmlFor="aiContextAware" className="text-sm text-zinc-300">Context-aware suggestions</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="aiLearnFromCode" className="w-4 h-4" />
                    <label htmlFor="aiLearnFromCode" className="text-sm text-zinc-300">Learn from codebase</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'languages' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Language Settings</h1>
              <p className="text-zinc-500 text-sm">Configure language-specific settings and formatters</p>
            </div>
            <div className="border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-4">Default Language</h3>
              <select 
                value={defaultLanguage} 
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm"
              >
                <option value="plaintext">Plain Text</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>
        )}

        {activeCategory === 'debugging' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-medium text-white mb-2">Debugging Settings</h1>
              <p className="text-zinc-500 text-sm">Configure debugger and breakpoint settings</p>
            </div>
            <div className="border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-4">Debug Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="debugAutoStart" 
                    checked={debugAutoStart} 
                    onChange={(e) => setDebugAutoStart(e.target.checked)}
                    className="w-4 h-4" 
                  />
                  <label htmlFor="debugAutoStart" className="text-sm text-zinc-300">Auto-start debugger</label>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">Debug Port</label>
                  <input 
                    type="number" 
                    value={debugPort} 
                    onChange={(e) => setDebugPort(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="debugConsole" 
                    checked={debugConsole} 
                    onChange={(e) => setDebugConsole(e.target.checked)}
                    className="w-4 h-4" 
                  />
                  <label htmlFor="debugConsole" className="text-sm text-zinc-300">Show debug console</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="debugBreakOnExceptions" 
                    checked={debugBreakOnExceptions} 
                    onChange={(e) => setDebugBreakOnExceptions(e.target.checked)}
                    className="w-4 h-4" 
                  />
                  <label htmlFor="debugBreakOnExceptions" className="text-sm text-zinc-300">Break on exceptions</label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
