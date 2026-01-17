'use client'

import { useIDEStore } from '@/stores/ide-store'
import { useHotkeys } from 'react-hotkeys-hook'

const aiActions = [
  { name: 'Refactor Function', icon: 'ph ph-arrows-clockwise', description: 'Optimize selected code for performance' },
  { name: 'Generate Tests', icon: 'ph ph-test-tube', description: 'Create unit tests for current file' },
  { name: 'Explain Code', icon: 'ph ph-question', description: 'Get explanation of selected code' },
  { name: 'Fix Bugs', icon: 'ph ph-bug', description: 'Identify and fix potential bugs' },
  { name: 'Document Code', icon: 'ph ph-note-pencil', description: 'Add documentation comments' },
]

export default function AIAssistant() {
  const { aiModal, setAIModal } = useIDEStore()

  useHotkeys('meta+i', (e) => {
    e.preventDefault()
    setAIModal(!aiModal)
  })

  useHotkeys('escape', () => {
    if (aiModal) setAIModal(false)
  })

  const runAction = (action: typeof aiActions[0]) => {
    console.log('Running AI action:', action.name)
    setAIModal(false)
  }

  if (!aiModal) return null

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[10vh] bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl glass border-line rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-6 py-4 gap-4 border-b-line">
          <i className="ph-fill ph-sparkle text-white text-xl"></i>
          <input 
            type="text" 
            placeholder="Ask AI: refactor this function for better performance..." 
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-zinc-700"
          />
          <button 
            onClick={() => setAIModal(false)}
            className="text-zinc-600 hover:text-white transition"
          >
            <i className="ph ph-x"></i>
          </button>
        </div>
        <div className="p-6 space-y-3 max-h-[450px] overflow-y-auto">
          <div className="label mb-4">Quick AI Actions</div>
          <div className="grid grid-cols-2 gap-3">
            {aiActions.map((action, i) => (
              <div
                key={i}
                onClick={() => runAction(action)}
                className="metric-card p-4 rounded-lg cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-bold text-white group-hover:text-white transition">
                    {action.name}
                  </span>
                  <i className={`${action.icon} text-zinc-600 group-hover:text-white transition`}></i>
                </div>
                <div className="text-xs text-zinc-600">{action.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}