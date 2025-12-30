'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import { useIDEStore } from '@/stores/ide-store'

export function useIDEHotkeys() {
  const {
    setCommandPalette,
    setAIChatOpen,
    setTerminalOpen,
    activePanel,
    setActivePanel,
    activeTab,
    tabs,
    addTab,
    closeTab,
    setActiveTab
  } = useIDEStore()

  // Command Palette
  useHotkeys('meta+k', (e) => {
    e.preventDefault()
    setCommandPalette(true)
  }, { preventDefault: true })

  // Save File
  useHotkeys('meta+s', (e) => {
    e.preventDefault()
    console.log('Save file')
  }, { preventDefault: true })

  // New File
  useHotkeys('meta+n', (e) => {
    e.preventDefault()
    const newFile = {
      id: `untitled-${Date.now()}`,
      name: 'Untitled',
      path: '/untitled',
      content: '',
      language: 'plaintext',
      isDirty: false,
      icon: 'ph-fill ph-file'
    }
    addTab(newFile)
  }, { preventDefault: true })

  // Close Tab
  useHotkeys('meta+w', (e) => {
    e.preventDefault()
    if (activeTab) {
      closeTab(activeTab)
    }
  }, { preventDefault: true })

  // Terminal
  useHotkeys('meta+j', (e) => {
    e.preventDefault()
    const { terminalOpen } = useIDEStore.getState()
    setTerminalOpen(!terminalOpen)
  }, { preventDefault: true })

  // AI Assistant
  useHotkeys('meta+i', (e) => {
    e.preventDefault()
    setAIChatOpen(true)
  }, { preventDefault: true })

  // Settings
  useHotkeys('meta+comma', (e) => {
    e.preventDefault()
    const { setView } = useIDEStore.getState()
    setView('settings')
  }, { preventDefault: true })

  // Toggle Sidebar
  useHotkeys('meta+b', (e) => {
    e.preventDefault()
    setActivePanel(activePanel ? '' : 'files')
  }, { preventDefault: true })

  // Switch Tabs
  useHotkeys('meta+1', (e) => {
    e.preventDefault()
    if (tabs[0]) setActiveTab(tabs[0].id)
  }, { preventDefault: true })

  useHotkeys('meta+2', (e) => {
    e.preventDefault()
    if (tabs[1]) setActiveTab(tabs[1].id)
  }, { preventDefault: true })

  useHotkeys('meta+3', (e) => {
    e.preventDefault()
    if (tabs[2]) setActiveTab(tabs[2].id)
  }, { preventDefault: true })

  // Escape - Close modals
  useHotkeys('escape', (e) => {
    e.preventDefault()
    setCommandPalette(false)
  }, { preventDefault: true })
}