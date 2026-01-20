'use client'

import { useState, useEffect } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'
import { useHotkeys } from 'react-hotkeys-hook'

export default function YamlEditor() {
  const { 
    yamlModal, 
    setYamlModal, 
    yamlFiles, 
    activeYamlFile, 
    addYamlFile, 
    updateYamlFile, 
    validateYaml, 
    runYaml,
    addTab,
    uploadYamlFile 
  } = useIDEStore()
  
  const [yamlContent, setYamlContent] = useState('')
  const [fileName, setFileName] = useState('config.yaml')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors?: string[] } | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const templates = {
    'docker': 'version: \'3.8\'\nservices:\n  app:\n    image: node:18\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production',
    'k8s': 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: my-app',
    'ci': 'name: CI\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n    - uses: actions/checkout@v3\n    - run: npm test'
  }

  useEffect(() => {
    if (activeYamlFile) {
      const file = yamlFiles.find(f => f.id === activeYamlFile)
      if (file) {
        setYamlContent(file.content)
        setFileName(file.name)
      }
    } else {
      setYamlContent('# YAML Configuration\nname: my-project\nversion: 1.0\n')
    }
  }, [activeYamlFile, yamlFiles])

  useHotkeys('escape', () => {
    if (yamlModal) setYamlModal(false)
  })

  const handleValidate = () => {
    setIsValidating(true)
    setTimeout(() => {
      const lines = yamlContent.split('\n')
      const errors: string[] = []
      
      lines.forEach((line, index) => {
        if (line.includes('\t')) {
          errors.push(`Line ${index + 1}: Use spaces, not tabs`)
        }
      })
      
      setValidationResult({ isValid: errors.length === 0, errors })
      setIsValidating(false)
    }, 500)
  }

  const handleSave = () => {
    if (activeYamlFile) {
      updateYamlFile(activeYamlFile, yamlContent)
    } else {
      const newFile = {
        id: `yaml-${Date.now()}`,
        name: fileName,
        path: `/${fileName}`,
        content: yamlContent,
        isValid: true
      }
      addYamlFile(newFile)
      addTab({
        id: newFile.id,
        name: newFile.name,
        path: newFile.path,
        content: newFile.content,
        language: 'yaml',
        isDirty: false,
        icon: 'ph-fill ph-file-text'
      })
    }
    setYamlModal(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.name.endsWith('.yml') || file.name.endsWith('.yaml'))) {
      uploadYamlFile(file)
      setYamlModal(false)
    }
    event.target.value = ''
  }

  if (!yamlModal) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-black/50 backdrop-blur-xl rounded-xl border border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <i className="ph ph-file-text text-white text-xl"></i>
            <h2 className="text-white font-medium">YAML Editor</h2>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-black/30 border border-zinc-700 rounded px-3 py-1 text-white text-sm w-48 focus:border-white/20 focus:outline-none"
              placeholder="filename.yaml"
            />
            <button 
              onClick={() => setYamlModal(false)}
              className="text-zinc-400 hover:text-white p-1 transition"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Templates Sidebar */}
          <div className="w-48 bg-black/30 border-r border-zinc-800 p-3">
            <div className="text-xs font-medium text-zinc-400 mb-3">Templates</div>
            <div className="space-y-1">
              {Object.entries(templates).map(([key, content]) => (
                <button
                  key={key}
                  onClick={() => {
                    setYamlContent(content)
                    setSelectedTemplate(key)
                  }}
                  className={`w-full text-left p-2 rounded text-xs transition ${
                    selectedTemplate === key 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {key === 'docker' ? 'Docker Compose' : key === 'k8s' ? 'Kubernetes' : 'GitHub Actions'}
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <label className="block w-full p-2 bg-black/30 hover:bg-black/50 text-white text-xs rounded cursor-pointer text-center transition border border-zinc-700 hover:border-zinc-600">
                <i className="ph ph-upload mr-1"></i>
                Upload YAML
                <input
                  type="file"
                  accept=".yml,.yaml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
              <div className="text-sm text-zinc-400">
                {yamlContent.split('\n').length} lines
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="px-3 py-1 bg-black/30 hover:bg-black/50 text-white text-xs rounded transition flex items-center gap-1 border border-zinc-700 hover:border-zinc-600"
                >
                  <i className={`ph ${isValidating ? 'ph-spinner animate-spin' : 'ph-check-circle'}`}></i>
                  {isValidating ? 'Validating...' : 'Validate'}
                </button>
                <button
                  onClick={() => activeYamlFile ? runYaml(activeYamlFile) : console.log('Running YAML:', yamlContent)}
                  className="px-3 py-1 bg-green-600/80 hover:bg-green-600 text-white text-xs rounded transition flex items-center gap-1"
                >
                  <i className="ph ph-play"></i>
                  Run
                </button>
                {activeYamlFile && (
                  <button
                    onClick={() => runYaml(activeYamlFile)}
                    className="px-3 py-1 bg-green-600/80 hover:bg-green-600 text-white text-xs rounded transition flex items-center gap-1"
                  >
                    <i className="ph ph-play"></i>
                    Run
                  </button>
                )}
              </div>
            </div>
            
            <textarea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              className="flex-1 bg-transparent text-white font-mono text-sm p-4 resize-none focus:outline-none"
              placeholder="# Enter your YAML configuration here...\nname: my-project\nversion: 1.0"
              spellCheck={false}
            />
            
            {/* Validation Results */}
            {validationResult && (
              <div className={`p-3 border-t border-zinc-800 text-xs ${
                validationResult.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <i className={`ph ${validationResult.isValid ? 'ph-check-circle' : 'ph-warning-circle'}`}></i>
                  {validationResult.isValid ? 'Valid YAML' : 'Validation Errors'}
                </div>
                {validationResult.errors?.map((error, i) => (
                  <div key={i} className="ml-5">• {error}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500">
            {yamlContent.length} characters
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setYamlModal(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-white/10 text-white rounded hover:bg-white/20 transition border border-white/20"
            >
              {activeYamlFile ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}