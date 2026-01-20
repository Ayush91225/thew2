import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { EditorSlice, createEditorSlice } from './slices/editor-slice'
import { UISlice, createUISlice } from './slices/ui-slice'

type StoreState = EditorSlice & UISlice

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createEditorSlice(...a),
        ...createUISlice(...a),
      }),
      {
        name: 'kriya-ide-storage',
        partialize: (state) => ({
          activeTab: state.activeTab,
          recentFiles: state.recentFiles,
          fontSize: state.fontSize,
          tabSize: state.tabSize,
          minimap: state.minimap,
          autoSave: state.autoSave,
          view: state.view,
          activePanel: state.activePanel,
          terminalOpen: state.terminalOpen,
        }),
      }
    )
  )
)

export type { FileTab } from './slices/editor-slice'
