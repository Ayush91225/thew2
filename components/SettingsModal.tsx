'use client'

import { useIDEStore } from '@/stores/ide-store'

export default function SettingsModal() {
  const { 
    settingsModal, 
    setSettingsModal, 
    fontSize, 
    setFontSize, 
    tabSize, 
    setTabSize, 
    minimap, 
    setMinimap, 
    autoSave, 
    setAutoSave 
  } = useIDEStore()

  if (!settingsModal) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl glass border-line rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-6 py-4 gap-4 border-b-line">
          <i className="ph ph-gear text-white text-xl"></i>
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button 
            onClick={() => setSettingsModal(false)}
            className="ml-auto text-zinc-400 hover:text-white"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-3">Font Size</label>
            <input 
              type="range" 
              min="10" 
              max="20" 
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-white"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-zinc-600">10px</span>
              <span className="text-xs text-white font-bold">{fontSize}px</span>
              <span className="text-xs text-zinc-600">20px</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-3">Tab Size</label>
            <div className="flex gap-3">
              <button 
                onClick={() => setTabSize(2)} 
                className={tabSize === 2 ? 'btn-primary' : 'btn-secondary'}
              >
                2 Spaces
              </button>
              <button 
                onClick={() => setTabSize(4)} 
                className={tabSize === 4 ? 'btn-primary' : 'btn-secondary'}
              >
                4 Spaces
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-4 border-b-line">
            <div>
              <div className="text-sm font-semibold text-white">Minimap</div>
              <div className="text-xs text-zinc-600 mt-1">Show code overview</div>
            </div>
            <button 
              onClick={() => setMinimap(!minimap)} 
              className={`relative w-14 h-7 rounded-full transition ${minimap ? 'bg-white' : 'bg-zinc-800'}`}
            >
              <div className={`w-7 h-7 bg-black rounded-full transition-transform absolute ${minimap ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="text-sm font-semibold text-white">Auto Save</div>
              <div className="text-xs text-zinc-600 mt-1">Save automatically on changes</div>
            </div>
            <button 
              onClick={() => setAutoSave(!autoSave)} 
              className={`relative w-14 h-7 rounded-full transition ${autoSave ? 'bg-white' : 'bg-zinc-800'}`}
            >
              <div className={`w-7 h-7 bg-black rounded-full transition-transform absolute ${autoSave ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}