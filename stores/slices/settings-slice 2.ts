import { StateCreator } from 'zustand'

export interface SettingsSlice {
  // AI settings
  aiEnabled: boolean
  aiModel: string
  aiTemperature: number
  aiMaxTokens: number
  aiAutoComplete: boolean
  aiCodeSuggestions: boolean
  aiErrorAnalysis: boolean
  aiDocGeneration: boolean
  aiPrivacyMode: boolean
  aiCustomPrompts: string[]
  
  // Notification settings
  notificationsEnabled: boolean
  desktopNotifications: boolean
  soundEnabled: boolean
  notificationVolume: number
  emailNotifications: boolean
  slackIntegration: boolean
  discordIntegration: boolean
  buildNotifications: boolean
  errorNotifications: boolean
  collaborationNotifications: boolean
  deploymentNotifications: boolean
  quietHours: boolean
  quietStart: string
  quietEnd: string
  
  // Keybinding settings
  keybindings: Record<string, string>
  customKeybindings: Record<string, string>
  keybindingPreset: string
  enableVimMode: boolean
  enableEmacsMode: boolean
  
  // Theme settings
  currentTheme: string
  customThemes: Record<string, any>
  themePreview: boolean
  autoThemeSwitch: boolean
  lightThemeTime: string
  darkThemeTime: string
  
  // Language settings
  languageSettings: Record<string, any>
  defaultLanguage: string
  languageAssociations: Record<string, string>
  
  // Debug settings
  debugAutoStart: boolean
  debugPort: number
  debugConsole: boolean
  debugBreakOnExceptions: boolean
  debugStepIntoLibraries: boolean
  debugShowInlineValues: boolean
  debugLogLevel: string
  
  // AI actions
  setAiEnabled: (enabled: boolean) => void
  setAiModel: (model: string) => void
  setAiTemperature: (temp: number) => void
  setAiMaxTokens: (tokens: number) => void
  setAiAutoComplete: (enabled: boolean) => void
  setAiCodeSuggestions: (enabled: boolean) => void
  setAiErrorAnalysis: (enabled: boolean) => void
  setAiDocGeneration: (enabled: boolean) => void
  setAiPrivacyMode: (enabled: boolean) => void
  addCustomPrompt: (prompt: string) => void
  removeCustomPrompt: (index: number) => void
  testAiConnection: () => void
  
  // Notification actions
  setNotificationsEnabled: (enabled: boolean) => void
  setDesktopNotifications: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setNotificationVolume: (volume: number) => void
  setEmailNotifications: (enabled: boolean) => void
  setSlackIntegration: (enabled: boolean) => void
  setDiscordIntegration: (enabled: boolean) => void
  setBuildNotifications: (enabled: boolean) => void
  setErrorNotifications: (enabled: boolean) => void
  setCollaborationNotifications: (enabled: boolean) => void
  setDeploymentNotifications: (enabled: boolean) => void
  setQuietHours: (enabled: boolean) => void
  setQuietStart: (time: string) => void
  setQuietEnd: (time: string) => void
  testNotification: () => void
  
  // Keybinding actions
  setKeybindingPreset: (preset: string) => void
  setCustomKeybinding: (action: string, keys: string) => void
  resetKeybindings: () => void
  setVimMode: (enabled: boolean) => void
  setEmacsMode: (enabled: boolean) => void
  exportKeybindings: () => void
  importKeybindings: (bindings: Record<string, string>) => void
  
  // Theme actions
  setTheme: (theme: string) => void
  createCustomTheme: (name: string, config: any) => void
  deleteCustomTheme: (name: string) => void
  setThemePreview: (enabled: boolean) => void
  setAutoThemeSwitch: (enabled: boolean) => void
  setLightThemeTime: (time: string) => void
  setDarkThemeTime: (time: string) => void
  exportTheme: (name: string) => void
  importTheme: (config: any) => void
  
  // Language actions
  setLanguageEnabled: (language: string, enabled: boolean) => void
  setLanguageAutoDetect: (language: string, enabled: boolean) => void
  setLanguageFormatter: (language: string, formatter: string) => void
  setLanguageLinter: (language: string, linter: string) => void
  setLanguageTabSize: (language: string, size: number) => void
  setLanguageInsertSpaces: (language: string, enabled: boolean) => void
  setLanguageTrimWhitespace: (language: string, enabled: boolean) => void
  setLanguageInsertFinalNewline: (language: string, enabled: boolean) => void
  setLanguageServer: (language: string, enabled: boolean) => void
  setLanguageSnippets: (language: string, enabled: boolean) => void
  setLanguageAutoComplete: (language: string, enabled: boolean) => void
  setLanguageBracketMatching: (language: string, enabled: boolean) => void
  setLanguageFolding: (language: string, enabled: boolean) => void
  setLanguageWordWrap: (language: string, enabled: boolean) => void
  setLanguageEmmet: (language: string, enabled: boolean) => void
  setDefaultLanguage: (language: string) => void
  addLanguageAssociation: (extension: string, language: string) => void
  removeLanguageAssociation: (extension: string) => void
  resetLanguageSettings: (language: string) => void
  
  // Debug actions
  setDebugAutoStart: (enabled: boolean) => void
  setDebugPort: (port: number) => void
  setDebugConsole: (enabled: boolean) => void
  setDebugBreakOnExceptions: (enabled: boolean) => void
  setDebugStepIntoLibraries: (enabled: boolean) => void
  setDebugShowInlineValues: (enabled: boolean) => void
  setDebugLogLevel: (level: string) => void
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  // AI settings
  aiEnabled: true,
  aiModel: 'GPT-4',
  aiTemperature: 0.7,
  aiMaxTokens: 2048,
  aiAutoComplete: true,
  aiCodeSuggestions: true,
  aiErrorAnalysis: true,
  aiDocGeneration: false,
  aiPrivacyMode: false,
  aiCustomPrompts: [],
  
  // Notification settings
  notificationsEnabled: true,
  desktopNotifications: true,
  soundEnabled: false,
  notificationVolume: 0.5,
  emailNotifications: false,
  slackIntegration: false,
  discordIntegration: false,
  buildNotifications: true,
  errorNotifications: true,
  collaborationNotifications: true,
  deploymentNotifications: true,
  quietHours: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  
  // Keybinding settings
  keybindings: {},
  customKeybindings: {},
  keybindingPreset: 'VSCode',
  enableVimMode: false,
  enableEmacsMode: false,
  
  // Theme settings
  currentTheme: 'Dark',
  customThemes: {},
  themePreview: false,
  autoThemeSwitch: false,
  lightThemeTime: '08:00',
  darkThemeTime: '20:00',
  
  // Language settings
  languageSettings: {},
  defaultLanguage: 'plaintext',
  languageAssociations: {},
  
  // Debug settings
  debugAutoStart: false,
  debugPort: 9229,
  debugConsole: true,
  debugBreakOnExceptions: false,
  debugStepIntoLibraries: false,
  debugShowInlineValues: true,
  debugLogLevel: 'info',
  
  // AI actions
  setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
  setAiModel: (model) => set({ aiModel: model }),
  setAiTemperature: (temp) => set({ aiTemperature: temp }),
  setAiMaxTokens: (tokens) => set({ aiMaxTokens: tokens }),
  setAiAutoComplete: (enabled) => set({ aiAutoComplete: enabled }),
  setAiCodeSuggestions: (enabled) => set({ aiCodeSuggestions: enabled }),
  setAiErrorAnalysis: (enabled) => set({ aiErrorAnalysis: enabled }),
  setAiDocGeneration: (enabled) => set({ aiDocGeneration: enabled }),
  setAiPrivacyMode: (enabled) => set({ aiPrivacyMode: enabled }),
  addCustomPrompt: (prompt) => set((state) => ({ aiCustomPrompts: [...state.aiCustomPrompts, prompt] })),
  removeCustomPrompt: (index) => set((state) => ({ aiCustomPrompts: state.aiCustomPrompts.filter((_, i) => i !== index) })),
  testAiConnection: () => {},
  
  // Notification actions
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setDesktopNotifications: (enabled) => set({ desktopNotifications: enabled }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setNotificationVolume: (volume) => set({ notificationVolume: volume }),
  setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
  setSlackIntegration: (enabled) => set({ slackIntegration: enabled }),
  setDiscordIntegration: (enabled) => set({ discordIntegration: enabled }),
  setBuildNotifications: (enabled) => set({ buildNotifications: enabled }),
  setErrorNotifications: (enabled) => set({ errorNotifications: enabled }),
  setCollaborationNotifications: (enabled) => set({ collaborationNotifications: enabled }),
  setDeploymentNotifications: (enabled) => set({ deploymentNotifications: enabled }),
  setQuietHours: (enabled) => set({ quietHours: enabled }),
  setQuietStart: (time) => set({ quietStart: time }),
  setQuietEnd: (time) => set({ quietEnd: time }),
  testNotification: () => {},
  
  // Keybinding actions
  setKeybindingPreset: (preset) => set({ keybindingPreset: preset }),
  setCustomKeybinding: (action, keys) => set((state) => ({ customKeybindings: { ...state.customKeybindings, [action]: keys } })),
  resetKeybindings: () => set({ customKeybindings: {} }),
  setVimMode: (enabled) => set({ enableVimMode: enabled }),
  setEmacsMode: (enabled) => set({ enableEmacsMode: enabled }),
  exportKeybindings: () => {},
  importKeybindings: (bindings) => set({ customKeybindings: bindings }),
  
  // Theme actions
  setTheme: (theme) => set({ currentTheme: theme }),
  createCustomTheme: (name, config) => set((state) => ({ customThemes: { ...state.customThemes, [name]: config } })),
  deleteCustomTheme: (name) => set((state) => { const themes = { ...state.customThemes }; delete themes[name]; return { customThemes: themes } }),
  setThemePreview: (enabled) => set({ themePreview: enabled }),
  setAutoThemeSwitch: (enabled) => set({ autoThemeSwitch: enabled }),
  setLightThemeTime: (time) => set({ lightThemeTime: time }),
  setDarkThemeTime: (time) => set({ darkThemeTime: time }),
  exportTheme: () => {},
  importTheme: (config) => set((state) => ({ customThemes: { ...state.customThemes, ...config } })),
  
  // Language actions
  setLanguageEnabled: () => {},
  setLanguageAutoDetect: () => {},
  setLanguageFormatter: () => {},
  setLanguageLinter: () => {},
  setLanguageTabSize: () => {},
  setLanguageInsertSpaces: () => {},
  setLanguageTrimWhitespace: () => {},
  setLanguageInsertFinalNewline: () => {},
  setLanguageServer: () => {},
  setLanguageSnippets: () => {},
  setLanguageAutoComplete: () => {},
  setLanguageBracketMatching: () => {},
  setLanguageFolding: () => {},
  setLanguageWordWrap: () => {},
  setLanguageEmmet: () => {},
  setDefaultLanguage: (language) => set({ defaultLanguage: language }),
  addLanguageAssociation: (extension, language) => set((state) => ({ languageAssociations: { ...state.languageAssociations, [extension]: language } })),
  removeLanguageAssociation: (extension) => set((state) => { const assoc = { ...state.languageAssociations }; delete assoc[extension]; return { languageAssociations: assoc } }),
  resetLanguageSettings: () => {},
  
  // Debug actions
  setDebugAutoStart: (enabled) => set({ debugAutoStart: enabled }),
  setDebugPort: (port) => set({ debugPort: port }),
  setDebugConsole: (enabled) => set({ debugConsole: enabled }),
  setDebugBreakOnExceptions: (enabled) => set({ debugBreakOnExceptions: enabled }),
  setDebugStepIntoLibraries: (enabled) => set({ debugStepIntoLibraries: enabled }),
  setDebugShowInlineValues: (enabled) => set({ debugShowInlineValues: enabled }),
  setDebugLogLevel: (level) => set({ debugLogLevel: level }),
})
