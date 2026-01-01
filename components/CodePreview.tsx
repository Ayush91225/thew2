'use client'

import { useIDEStore } from '@/stores/ide-store'

export default function CodePreview() {
  const { 
    previewOpen, 
    previewUrl, 
    previewMode, 
    setPreviewOpen, 
    setPreviewUrl, 
    setPreviewMode,
    activeTab,
    tabs
  } = useIDEStore()

  if (!previewOpen) return null

  const activeFile = activeTab ? tabs.find(tab => tab.id === activeTab) : null
  const isWebUrl = previewUrl.startsWith('http')
  const showCode = !isWebUrl || !previewUrl.trim()

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return 'w-80 h-[600px]'
      case 'tablet':
        return 'w-[768px] h-[600px]'
      default:
        return 'w-full h-full'
    }
  }

  const renderCodePreview = () => {
    if (!activeFile) {
      return (
        <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
          No file selected
        </div>
      )
    }

    return (
      <div className="h-full overflow-auto">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm">
            <i className="ph ph-file-text text-zinc-400"></i>
            <span className="text-white">{activeFile.name}</span>
            <span className="text-zinc-500">({activeFile.language})</span>
          </div>
        </div>
        <pre className="p-4 text-sm font-mono text-white whitespace-pre-wrap overflow-auto">
          <code>{activeFile.content}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black border-l border-zinc-800 w-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <i className="ph ph-globe text-white text-sm"></i>
          <span className="text-white text-sm font-medium">Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-900 rounded p-1">
            <button
              onClick={() => setPreviewMode('browser')}
              className={`p-1 rounded text-xs transition ${
                previewMode === 'browser' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className="ph ph-monitor"></i>
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-1 rounded text-xs transition ${
                previewMode === 'tablet' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className="ph ph-tablet"></i>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1 rounded text-xs transition ${
                previewMode === 'mobile' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className="ph ph-device-mobile"></i>
            </button>
          </div>
          <button
            onClick={() => setPreviewOpen(false)}
            className="text-zinc-400 hover:text-white p-1 transition"
          >
            <i className="ph ph-x text-sm"></i>
          </button>
        </div>
      </div>

      {/* URL Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800">
        <input
          type="text"
          value={previewUrl}
          onChange={(e) => setPreviewUrl(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-1 text-white text-sm focus:border-white/20 focus:outline-none"
          placeholder="http://localhost:3000 or leave empty for code view"
        />
        <button
          onClick={() => {
            const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
            if (iframe) iframe.src = previewUrl
          }}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded text-xs transition"
        >
          <i className="ph ph-arrow-clockwise"></i>
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {showCode ? (
          renderCodePreview()
        ) : (
          <div className="p-3 h-full">
            <div className={`mx-auto ${getPreviewDimensions()}`}>
              <iframe
                id="preview-iframe"
                src={previewUrl}
                className="w-full h-full bg-white rounded border border-zinc-700"
                title="Code Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}