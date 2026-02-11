'use client'

import { useIDEStore } from '@/stores/ide-store-fast'

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, string> = {
    js: 'ph-fill ph-file-js',
    jsx: 'ph-fill ph-file-jsx', 
    ts: 'ph-fill ph-file-ts',
    tsx: 'ph-fill ph-file-tsx',
    py: 'ph-fill ph-file-py',
    java: 'ph-fill ph-file-java',
    html: 'ph-fill ph-file-html',
    css: 'ph-fill ph-file-css',
    json: 'ph-fill ph-brackets-curly',
    md: 'ph-fill ph-file-text',
    txt: 'ph-fill ph-file-text',
    yml: 'ph-fill ph-file-text',
    yaml: 'ph-fill ph-file-text',
  }
  return iconMap[ext || ''] || 'ph-fill ph-file'
}

export default function FileTabs() {
  const { tabs, activeTab, setActiveTab, closeTab } = useIDEStore()

  if (tabs.length === 0) return null

  return (
    <div className="flex items-center border-b-line bg-black/20">
      <div className="flex items-center overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-4 py-3 border-r-line cursor-pointer group
              transition-all duration-200 min-w-0 max-w-48 h-11
              ${activeTab === tab.id 
                ? 'tab-active' 
                : 'hover:bg-white/5 text-zinc-400'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`${getFileIcon(tab.name)} text-sm`}></i>
            <span className="text-sm font-medium truncate">{tab.name}</span>
            {tab.isDirty && (
              <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-1 transition-all"
            >
              <i className="ph ph-x text-xs"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}