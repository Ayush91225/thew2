'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useIDEStore } from '@/stores/ide-store'

interface LiveServerConfig {
  port: number
  host: string
  root: string
  open: boolean
  cors: boolean
  https: boolean
}

export default function PreviewPanel() {
  const { 
    previewOpen, 
    previewUrl, 
    previewMode, 
    setPreviewOpen, 
    setPreviewUrl, 
    setPreviewMode,
    tabs,
    activeTab,
    terminalOpen,
    setTerminalOpen
  } = useIDEStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isServerRunning, setIsServerRunning] = useState(false)
  const [serverPort, setServerPort] = useState(3000)
  const [autoReload, setAutoReload] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertUrl, setAlertUrl] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [urlInput, setUrlInput] = useState(previewUrl)
  const [serverConfig, setServerConfig] = useState<LiveServerConfig>({
    port: 3000,
    host: 'localhost',
    root: '/',
    open: true,
    cors: true,
    https: false
  })

  const [isResizing, setIsResizing] = useState(false)
  const displayAlert = (url: string) => {
    setAlertUrl(url)
    setShowAlert(true)
  }

  const handleOpenInTab = () => {
    window.open(alertUrl, '_blank', 'noopener,noreferrer')
    setShowAlert(false)
    setIsLoading(false)
  }

  // Auto-update preview when content changes
  useEffect(() => {
    const activeTabData = tabs.find(tab => tab.id === activeTab)
    if (activeTabData && isServerRunning && (activeTabData.language === 'html' || activeTabData.name.endsWith('.html'))) {
      let content = activeTabData.content
      
      // Inject live reload for HTML files
      if (activeTabData.language === 'html' || activeTabData.name.endsWith('.html')) {
        const liveReloadScript = `
<script>
(function() {
  console.log('Live reload active');
})();
</script>`
        
        if (content.includes('</body>')) {
          content = content.replace('</body>', liveReloadScript + '\n</body>')
        } else if (content.includes('</html>')) {
          content = content.replace('</html>', liveReloadScript + '\n</html>')
        } else {
          content += liveReloadScript
        }
      }
      
      const blob = new Blob([content], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      // Clean up previous URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      
      setPreviewUrl(url)
    }
  }, [activeTab, tabs, isServerRunning, setPreviewUrl])

  // Auto-update server when content changes
  useEffect(() => {
    if (isServerRunning && tabs.length > 0) {
      const updateServer = async () => {
        const files: Record<string, string> = {}
        tabs.forEach(tab => {
          files[tab.name] = tab.content
        })
        
        try {
          const response = await fetch('/api/server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files })
          })
          
          if (response.ok && autoReload) {
            const { entryFile } = await response.json()
            const newUrl = `/api/server?file=${entryFile}&t=${Date.now()}`
            setPreviewUrl(newUrl)
          }
        } catch (error) {
          console.error('Failed to update server:', error)
        }
      }
      
      const timer = setTimeout(updateServer, 500)
      return () => clearTimeout(timer)
    }
  }, [tabs, isServerRunning, autoReload, setPreviewUrl])

  const startLiveServer = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Starting live server with tabs:', tabs.map(t => t.name))
      
      // Prepare files from IDE tabs
      const files: Record<string, string> = {}
      tabs.forEach(tab => {
        files[tab.name] = tab.content
        console.log(`Tab: ${tab.name}, content length: ${tab.content.length}`)
      })
      
      // Check if we have any HTML files
      const hasHtml = Object.keys(files).some(name => name.endsWith('.html'))
      if (!hasHtml) {
        throw new Error('No HTML file found. Create an HTML file to preview.')
      }
      
      console.log('Sending files to server:', Object.keys(files))
      
      // Start server with files
      const response = await fetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response error:', response.status, errorText)
        throw new Error(`Server error: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Server response:', result)
      
      setIsServerRunning(true)
      setPreviewUrl(result.url)
      setUrlInput(`localhost:${serverPort}/${result.entryFile}`)
      
      console.log('Preview URL set to:', result.url)
      
      if (!terminalOpen) {
        setTerminalOpen(true)
      }
      
    } catch (err) {
      console.error('Live server error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start live server')
      setIsServerRunning(false)
    } finally {
      setIsLoading(false)
    }
  }, [tabs, serverPort, setPreviewUrl, terminalOpen, setTerminalOpen])

  const stopLiveServer = useCallback(() => {
    setIsServerRunning(false)
    setPreviewUrl('')
    setUrlInput('')
  }, [setPreviewUrl])

  const openInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer')
    }
  }, [previewUrl])

  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      setIsLoading(true)
      setError(null)
      
      // Force reload by adding timestamp
      const url = new URL(previewUrl.startsWith('blob:') ? previewUrl : previewUrl)
      if (!previewUrl.startsWith('blob:')) {
        url.searchParams.set('_t', Date.now().toString())
      }
      
      iframeRef.current.src = url.toString()
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (urlInput.trim()) {
      // Clean up previous blob URL if it exists
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      
      let url = urlInput.trim()
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:')) {
        url = 'https://' + url
      }
      
      setPreviewUrl(url)
      setIsLoading(true)
      setError(null)
      setIsBlocked(false)
      setIsServerRunning(false)
      
      // Show alert for external URLs
      if (!url.startsWith('blob:') && !url.includes('localhost')) {
        setTimeout(() => displayAlert(url), 1000)
      }
    }
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
    setIsBlocked(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setIsBlocked(true)
    setError('This site cannot be displayed in preview')
    
    if (previewUrl) {
      displayAlert(previewUrl)
    }
  }

  // Detect X-Frame-Options blocking
  useEffect(() => {
    if (previewUrl && !previewUrl.startsWith('blob:')) {
      const timer = setTimeout(() => {
        if (iframeRef.current && isLoading) {
          setIsBlocked(true)
          setIsLoading(false)
          setError('This site cannot be displayed in preview')
          displayAlert(previewUrl)
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [previewUrl, isLoading])

  const getDeviceClass = () => {
    switch (previewMode) {
      case 'mobile':
        return 'w-[320px] h-[568px]'
      case 'tablet':
        return 'w-[768px] h-[600px]'
      default:
        return 'w-full h-full'
    }
  }

  const getResponsiveWidth = () => {
    switch (previewMode) {
      case 'mobile':
        return 'w-80 min-w-80'
      case 'tablet':
        return 'w-[800px] min-w-[800px]'
      default:
        return 'flex-shrink-0'
    }
  }

  if (!previewOpen) return null

  return (
    <div className={`${getResponsiveWidth()} flex flex-col h-full bg-zinc-950 border-l border-zinc-800 min-w-0 relative`} style={{ width: previewMode === 'browser' ? '400px' : undefined }}>
      {/* Resize Handle - Only show in browser mode */}
      {previewMode === 'browser' && (
        <div 
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-20 ${
            isResizing ? 'bg-zinc-400' : 'bg-transparent hover:bg-zinc-500/50'
          } transition-colors`}
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizing(true)
            const startX = e.clientX
            const element = e.currentTarget.parentElement as HTMLElement
            const startWidth = element?.offsetWidth || 400
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX
              const newWidth = Math.max(300, Math.min(1200, startWidth + deltaX))
              if (element) {
                element.style.width = `${newWidth}px`
              }
            }
            
            const handleMouseUp = () => {
              setIsResizing(false)
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }
            
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        ></div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <i className="ph ph-monitor text-zinc-500 text-sm"></i>
          <span className="text-sm text-zinc-300">Preview</span>
          {isServerRunning && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
              <div className="w-1 h-1 bg-zinc-400 rounded-full"></div>
              <span>:{serverPort}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
          {/* Live Server Controls */}
          {!isServerRunning ? (
            <button
              onClick={startLiveServer}
              disabled={isLoading}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 rounded transition-colors flex items-center gap-1"
              title="Start Live Server"
            >
              {isLoading ? (
                <i className="ph ph-spinner animate-spin text-xs"></i>
              ) : (
                <i className="ph ph-play text-xs"></i>
              )}
              Live
            </button>
          ) : (
            <button
              onClick={stopLiveServer}
              className="px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
              title="Stop Live Server"
            >
              <i className="ph ph-stop text-xs"></i>
              Stop
            </button>
          )}
          
          <button
            onClick={() => setAutoReload(!autoReload)}
            className={`p-1 text-xs rounded transition-colors ${
              autoReload 
                ? 'text-zinc-200 bg-zinc-800' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Auto Reload"
          >
            <i className="ph ph-arrow-clockwise"></i>
          </button>
          
          {/* Device Mode Selector */}
          <div className="flex items-center bg-zinc-900 rounded ml-1 p-0.5">
            <button
              onClick={() => setPreviewMode('browser')}
              className={`p-1 text-xs rounded transition-colors ${
                previewMode === 'browser'
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Desktop"
            >
              <i className="ph ph-desktop"></i>
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-1 text-xs rounded transition-colors ${
                previewMode === 'tablet'
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Tablet"
            >
              <i className="ph ph-device-tablet"></i>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1 text-xs rounded transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Mobile"
            >
              <i className="ph ph-device-mobile"></i>
            </button>
          </div>
          
          <button
            onClick={openInNewTab}
            disabled={!previewUrl}
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors disabled:opacity-30"
            title="Open in New Tab"
          >
            <i className="ph ph-arrow-square-out text-xs"></i>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={!previewUrl}
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors disabled:opacity-30"
            title="Refresh"
          >
            <i className="ph ph-arrow-clockwise text-xs"></i>
          </button>
          
          <button
            onClick={() => setPreviewOpen(false)}
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors ml-1"
            title="Close Preview"
          >
            <i className="ph ph-x text-xs"></i>
          </button>
        </div>
      </div>

      {/* URL Bar */}
      <div className="p-2 border-b border-zinc-800">
        <form onSubmit={handleUrlSubmit} className="flex gap-1">
          <div className="flex-1 relative">
            <i className="ph ph-globe absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-600 text-xs"></i>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={isServerRunning ? `localhost:${serverPort}` : "Enter URL..."}
              className="w-full pl-7 pr-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 rounded transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
        {!previewUrl ? (
          <div className="text-center text-zinc-600">
            <i className="ph ph-monitor text-2xl mb-2"></i>
            <p className="text-xs mb-1">Start live server or enter URL</p>
            <button
              onClick={startLiveServer}
              disabled={isLoading}
              className="mt-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 rounded transition-colors flex items-center gap-1 mx-auto"
            >
              {isLoading ? (
                <i className="ph ph-spinner animate-spin"></i>
              ) : (
                <i className="ph ph-play"></i>
              )}
              Go Live
            </button>
          </div>
        ) : (
          <div className={`relative ${getDeviceClass()} ${previewMode !== 'browser' ? 'border border-zinc-800 rounded overflow-hidden' : ''} max-w-full max-h-full`}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 z-10">
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="w-3 h-3 border border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                  <span className="text-xs">Loading...</span>
                </div>
              </div>
            )}
            
            {(error || isBlocked) && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                <div className="text-center text-zinc-500 max-w-xs px-4">
                  <i className="ph ph-warning-circle text-xl mb-2"></i>
                  <p className="text-xs mb-3">{error}</p>
                  <button
                    onClick={openInNewTab}
                    className="px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors flex items-center gap-1 mx-auto"
                  >
                    <i className="ph ph-arrow-square-out"></i>
                    Open in New Tab
                  </button>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title="Live Preview"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-t border-zinc-800 text-xs text-zinc-600">
        <div className="flex items-center gap-3">
          <span>{previewMode}</span>
          {previewMode !== 'browser' && (
            <span className="text-zinc-700">
              {previewMode === 'mobile' ? '320×568' : '768×600'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {autoReload && isServerRunning && (
            <span className="text-zinc-500">auto-reload</span>
          )}
          
          {previewUrl && (
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                error ? 'bg-zinc-500' : 
                isLoading ? 'bg-zinc-500' : 
                isServerRunning ? 'bg-zinc-400' : 'bg-zinc-500'
              }`}></div>
              <span className="text-zinc-600">
                {error ? 'error' : 
                 isLoading ? 'loading' : 
                 isServerRunning ? 'live' : 'static'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Smooth Alert Notification */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className="ph ph-warning-circle text-zinc-400"></i>
              <span className="text-xs text-zinc-300">Preview Blocked</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">Site cannot be displayed in iframe</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAlert(false)}
                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 rounded transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleOpenInTab}
                className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors flex items-center gap-1"
              >
                <i className="ph ph-arrow-square-out"></i>
                Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}