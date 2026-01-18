'use client'

import { useState, useEffect } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'
import { useHotkeys } from 'react-hotkeys-hook'

interface SearchResult {
  file: string
  line: number
  column: number
  content: string
}

export default function GlobalSearch() {
  const { 
    globalSearch, 
    setGlobalSearch, 
    globalSearchQuery,
    setGlobalSearchQuery,
    tabs, 
    addTab,
    setActiveTab
  } = useIDEStore()
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useHotkeys('meta+shift+f', (e) => {
    e.preventDefault()
    setGlobalSearch(!globalSearch)
  })

  useHotkeys('escape', () => {
    if (globalSearch) setGlobalSearch(false)
  })

  useEffect(() => {
    if (globalSearchQuery.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    
    // Search through open tabs client-side
    const searchResults: SearchResult[] = []
    const query = globalSearchQuery.toLowerCase()
    
    tabs.forEach(tab => {
      const lines = tab.content.split('\n')
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(query)) {
          searchResults.push({
            file: tab.name,
            line: idx + 1,
            column: 1,
            content: line.trim()
          })
        }
      })
    })
    
    setResults(searchResults)
    setIsSearching(false)
  }, [globalSearchQuery, tabs])

  const jumpToResult = async (result: SearchResult) => {
    const existingTab = tabs.find(tab => tab.name === result.file)
    
    if (existingTab) {
      setActiveTab(existingTab.id)
    } else {
      const res = await fetch(`/api/files?path=${encodeURIComponent(result.file)}`)
      const data = await res.json()
      const newTab = {
        id: `${result.file}-${Date.now()}`,
        name: result.file,
        path: result.file,
        content: data.content || '',
        language: result.file.endsWith('.ts') || result.file.endsWith('.tsx') ? 'typescript' : 'javascript',
        isDirty: false,
        icon: 'ph-fill ph-file-js'
      }
      addTab(newTab)
    }
    
    setGlobalSearch(false)
  }

  if (!globalSearch) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[8vh] bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl glass border-line rounded-xl shadow-2xl overflow-hidden">
        <div className="border-b-line p-4">
          <div className="flex items-center gap-4 mb-4">
            <i className="ph ph-magnifying-glass text-white text-xl"></i>
            <h2 className="text-white font-semibold">Global Search</h2>
          </div>
          
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search across files..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="flex-1 bg-black/50 border-line rounded px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              autoFocus
            />
            <button 
              onClick={() => setGlobalSearch(false)}
              className="text-zinc-600 hover:text-white transition px-2"
            >
              <i className="ph ph-x"></i>
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center text-zinc-600">
              <i className="ph ph-spinner animate-spin text-2xl mb-2"></i>
              <div>Searching...</div>
            </div>
          ) : results.length > 0 ? (
            <div className="p-4">
              <div className="text-xs text-zinc-400 mb-3">
                {results.length} results found
              </div>
              
              <div className="space-y-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => jumpToResult(result)}
                    className="hover-item p-3 rounded-lg cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <i className="ph-fill ph-file text-zinc-600 group-hover:text-white transition"></i>
                        <span className="text-sm font-semibold text-white">{result.file}</span>
                      </div>
                      <span className="text-xs text-zinc-600">
                        Line {result.line}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      {result.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : globalSearchQuery.length >= 2 ? (
            <div className="p-8 text-center text-zinc-600">
              <i className="ph ph-magnifying-glass text-2xl mb-2"></i>
              <div>No results found</div>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-600">
              <i className="ph ph-magnifying-glass text-2xl mb-2"></i>
              <div>Start typing to search across files</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}