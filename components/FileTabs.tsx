'use client'

import { motion } from 'framer-motion'
import { useIDEStore } from '@/stores/ide-store'
import { X, Circle } from 'phosphor-react'
import { getFileLanguage } from '@/lib/utils'

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, string> = {
    js: '🟨',
    jsx: '⚛️',
    ts: '🔷',
    tsx: '⚛️',
    py: '🐍',
    java: '☕',
    html: '🌐',
    css: '🎨',
    json: '📋',
    md: '📝',
    txt: '📄',
  }
  return iconMap[ext || ''] || '📄'
}

export default function FileTabs() {
  const { tabs, activeTab, setActiveTab, closeTab } = useIDEStore()

  if (tabs.length === 0) return null

  return (
    <div className="flex items-center border-b-line bg-black/20">
      <div className="flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`
              flex items-center gap-2 px-4 py-3 border-r-line cursor-pointer group
              transition-all duration-200 min-w-0 max-w-48
              ${activeTab === tab.id 
                ? 'tab-active' 
                : 'hover:bg-white/5 text-zinc-400'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-sm">{getFileIcon(tab.name)}</span>
            <span className="text-sm font-medium truncate">{tab.name}</span>
            {tab.isDirty && (
              <Circle size={6} weight="fill" className="text-white flex-shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-1 transition-all"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}