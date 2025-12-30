'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIDEStore } from '@/stores/ide-store'
import { useHotkeys } from 'react-hotkeys-hook'

interface SearchResult {
  file: string
  line: number
  column: number
  content: string
  match: string
}

export default function GlobalSearch() {
  const { 
    globalSearch, 
    setGlobalSearch, 
    globalSearchQuery,
    setGlobalSearchQuery,
    tabs, 
    addTab,
    updateTabContent,
    setActiveTab
  } = useIDEStore()
  const [replaceQuery, setReplaceQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'search' | 'replace'>('search')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)

  useHotkeys('meta+shift+f', (e) => {
    e.preventDefault()
    setGlobalSearch(!globalSearch)
  })

  useHotkeys('escape', () => {
    if (globalSearch) setGlobalSearch(false)
  })

  const performSearch = useCallback(async () => {
    setIsSearching(true)
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const searchResults: SearchResult[] = []
    
    // Search through all open tabs
    tabs.forEach(tab => {
      const lines = tab.content.split('\n')
      lines.forEach((line, lineIndex) => {
        let searchPattern: RegExp
        
        try {
          if (useRegex) {
            searchPattern = new RegExp(globalSearchQuery, caseSensitive ? 'g' : 'gi')
          } else {
            const escapedQuery = globalSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery
            searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
          }
          
          let match
          while ((match = searchPattern.exec(line)) !== null) {
            searchResults.push({
              file: tab.name,
              line: lineIndex + 1,
              column: match.index + 1,
              content: line.trim(),
              match: match[0]
            })
            
            // Prevent infinite loop with global regex
            if (!searchPattern.global) break
          }
        } catch (error) {
          // Invalid regex, skip
        }
      })
    })
    
    // Add mock results for demonstration
    if (globalSearchQuery.toLowerCase().includes('function')) {
      searchResults.push(
        {
          file: 'utils/helpers.ts',
          line: 15,
          column: 8,
          content: 'export function formatDate(date: Date): string {',
          match: 'function'
        },
        {
          file: 'components/Button.tsx',
          line: 23,
          column: 12,
          content: 'const handleClick = function() {',
          match: 'function'
        }
      )
    }
    
    if (globalSearchQuery.toLowerCase().includes('import')) {
      searchResults.push(
        {
          file: 'app/layout.tsx',
          line: 1,
          column: 1,
          content: "import type { Metadata } from 'next'",
          match: 'import'
        },
        {
          file: 'components/MainEditor.tsx',
          line: 3,
          column: 1,
          content: "import { useIDEStore } from '@/stores/ide-store'",
          match: 'import'
        }
      )
    }
    
    setResults(searchResults)
    setIsSearching(false)
  }, [globalSearchQuery, caseSensitive, wholeWord, useRegex, tabs])

  useEffect(() => {
    if (globalSearchQuery.length > 2) {
      performSearch()
    } else {
      setResults([])
    }
  }, [globalSearchQuery, caseSensitive, wholeWord, useRegex, performSearch])

  const jumpToResult = (result: SearchResult) => {
    // Find existing tab or create new one
    const existingTab = tabs.find(tab => tab.name === result.file)
    
    if (existingTab) {
      // Switch to existing tab
      setActiveTab(existingTab.id)
      console.log(`Jump to ${result.file}:${result.line}:${result.column}`)
    } else {
      // Create new tab for the file
      const newTab = {
        id: `${result.file}-${Date.now()}`,
        name: result.file,
        path: `/${result.file}`,
        content: `// Content of ${result.file}\n// Line ${result.line}: ${result.content}\n\n// This is a mock file for demonstration\n// In a real implementation, this would load the actual file content`,
        language: result.file.endsWith('.ts') || result.file.endsWith('.tsx') ? 'typescript' : 'javascript',
        isDirty: false,
        icon: 'ph-fill ph-file-js'
      }
      addTab(newTab)
    }
    
    setGlobalSearch(false)
  }

  const replaceAll = () => {
    if (!replaceQuery || results.length === 0) return
    
    // Update all tabs with replacements
    const updatedTabs = tabs.map(tab => {
      let updatedContent = tab.content
      
      try {
        let searchPattern: RegExp
        
        if (useRegex) {
          searchPattern = new RegExp(globalSearchQuery, caseSensitive ? 'g' : 'gi')
        } else {
          const escapedQuery = globalSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery
          searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
        }
        
        updatedContent = updatedContent.replace(searchPattern, replaceQuery)
        
        // Mark tab as dirty if content changed
        if (updatedContent !== tab.content) {
          return { ...tab, content: updatedContent, isDirty: true }
        }
      } catch (error) {
        // Invalid regex, skip this tab
      }
      
      return tab
    })
    
    // Update store with new tab contents
    updatedTabs.forEach(tab => {
      if (tab.isDirty && tab.content !== tabs.find(t => t.id === tab.id)?.content) {
        updateTabContent(tab.id, tab.content)
      }
    })
    
    console.log(`Replaced all "${globalSearchQuery}" with "${replaceQuery}" in ${results.length} locations`)
    setGlobalSearch(false)
  }

  if (!globalSearch) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[8vh] bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl glass border-line rounded-xl shadow-2xl overflow-hidden">
        
        {/* Search Header */}
        <div className="border-b-line p-4">
          <div className="flex items-center gap-4 mb-4">
            <i className="ph ph-magnifying-glass text-white text-xl"></i>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchMode('search')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  searchMode === 'search' ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setSearchMode('replace')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  searchMode === 'replace' ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'
                }`}
              >
                Replace
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
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
            
            {searchMode === 'replace' && (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="flex-1 bg-black/50 border-line rounded px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                />
                <button
                  onClick={replaceAll}
                  disabled={!replaceQuery || results.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Replace All ({results.length})
                </button>
              </div>
            )}
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="w-3 h-3"
                />
                Case sensitive
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="w-3 h-3"
                />
                Whole word
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(e) => setUseRegex(e.target.checked)}
                  className="w-3 h-3"
                />
                Regex
              </label>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-4">
              <div className="text-xs text-zinc-400 mb-3">
                {results.length} result{results.length !== 1 ? 's' : ''} in {new Set(results.map(r => r.file)).size} file{new Set(results.map(r => r.file)).size !== 1 ? 's' : ''}
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
                        Line {result.line}, Column {result.column}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      {result.content.replace(
                        new RegExp(result.match, 'gi'),
                        `<mark class="bg-yellow-400 text-black px-1 rounded">${result.match}</mark>`
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : globalSearchQuery.length > 2 && !isSearching ? (
            <div className="p-8 text-center text-zinc-600">
              <i className="ph ph-magnifying-glass text-2xl mb-2"></i>
              <div>No results found for &quot;{globalSearchQuery}&quot;</div>
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