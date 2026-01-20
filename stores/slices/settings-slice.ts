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
