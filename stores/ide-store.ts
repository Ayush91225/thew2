import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { FileTreeManager, FileTreeNode } from '@/lib/file-tree'

export interface FileTab {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirty: boolean
  icon?: string
}

interface TerminalTab {
  id: string
  name: string
  type: 'bash' | 'node' | 'python'
  isActive: boolean
}

interface CollaborationUser {
  id: string
  name: string
  avatar: string
  cursor?: {
    line: number
    column: number
  }
}

interface APIRequest {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: Record<string, string>
  body?: string
}

interface Extension {
  id: string
  name: string
  version: string
  category: string
  downloads: string
  status: 'active' | 'disabled' | 'update-available'
  icon: string
}

interface YamlFile {
  id: string
  name: string
  path: string
  content: string
  isValid: boolean
  errors?: string[]
  isRunning?: boolean
  lastRun?: Date
  runStatus?: 'success' | 'error' | 'running'
}

interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface IDEState {
  // UI State
  commandPalette: boolean
  aiModal: boolean
  yamlModal: boolean
  aiChatOpen: boolean
  settingsModal: boolean
  settingsOpen: boolean
  globalSearch: boolean
  globalSearchQuery: string
  terminalOpen: boolean
  view: string
  previousView: string
  collab: boolean
  environment: 'production' | 'development'
  activePanel: string
  isRunning: boolean
  runningFile: string | null
  
  // Editor State
  activeTab: string | null
  tabs: FileTab[]
  recentFiles: string[]
  
  // File Tree State
  fileTree: FileTreeNode | null
  fileTreeVersion: number
  
  // AI Chat State
  aiMessages: AIMessage[]
  aiInputValue: string
  
  // Terminal State
  terminalTabs: TerminalTab[]
  activeTerminalTab: string | null
  
  // Debug State
  breakpoints: Record<string, number[]>
  debugSession: boolean
  
  // API State
  apiRequests: APIRequest[]
  activeApiRequest: string | null
  
  // YAML State
  yamlFiles: YamlFile[]
  activeYamlFile: string | null
  
  // Project State
  projectRoot: string | null
  projectFiles: any[]
  
  // Settings
  fontSize: number
  tabSize: number
  minimap: boolean
  autoSave: boolean
  
  // Performance Metrics
  cpuUsage: number
  memoryUsage: number
  buildTime: number
  
  // Performance Settings
  maxFileSize: number
  syntaxHighlighting: string
  lazyLoading: boolean
  incrementalBuild: boolean
  memoryLimit: number
  buildThreads: string
  memoryOptimization: boolean
  buildCache: boolean
  
  // Extension Settings
  extensions: Extension[]
  extensionSearchQuery: string
  extensionFilter: string
  autoUpdateExtensions: boolean
  trustedExtensionsOnly: boolean
  extensionSandbox: boolean
  
  // AI Assistant Settings
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
  
  // Keybinding Settings
  keybindings: Record<string, string>
  customKeybindings: Record<string, string>
  keybindingPreset: string
  enableVimMode: boolean
  enableEmacsMode: boolean
  
  // Theme Settings
  currentTheme: string
  customThemes: Record<string, any>
  themePreview: boolean
  autoThemeSwitch: boolean
  lightThemeTime: string
  darkThemeTime: string
  
  // Language Settings
  languageSettings: Record<string, {
    enabled: boolean
    autoDetect: boolean
    formatter: string
    linter: string
    tabSize: number
    insertSpaces: boolean
    trimWhitespace: boolean
    insertFinalNewline: boolean
    languageServer: boolean
    snippets: boolean
    autoComplete: boolean
    bracketMatching: boolean
    folding: boolean
    wordWrap: boolean
    emmet: boolean
  }>
  defaultLanguage: string
  languageAssociations: Record<string, string>
  
  // Debug Settings
  debugAutoStart: boolean
  debugPort: number
  debugConsole: boolean
  debugBreakOnExceptions: boolean
  debugStepIntoLibraries: boolean
  debugShowInlineValues: boolean
  debugLogLevel: string
  
  // Preview Settings
  previewOpen: boolean
  previewUrl: string
  previewMode: 'browser' | 'mobile' | 'tablet'
  
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
  
  // Git State
  gitBranch: string
  gitStatus: 'clean' | 'modified' | 'staged' | 'committed'
  uncommittedChanges: number
  
  // Actions
  setCommandPalette: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  setAIModal: (open: boolean) => void
  setYamlModal: (open: boolean) => void
  setAIChatOpen: (open: boolean) => void
  setSettingsModal: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setGlobalSearch: (open: boolean) => void
  setGlobalSearchQuery: (query: string) => void
  setTerminalOpen: (open: boolean) => void
  setView: (view: string) => void
  setCollab: (collab: boolean) => void
  setEnvironment: (env: 'production' | 'development') => void
  setActivePanel: (panel: string) => void
  setActiveTab: (tabId: string) => void
  runCurrentFile: () => void
  addTab: (file: FileTab) => void
  closeTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  
  // AI Chat Actions
  addAIMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void
  setAIInputValue: (value: string) => void
  clearAIChat: () => void
  
  // Terminal Actions
  addTerminalTab: (tab: TerminalTab) => void
  closeTerminalTab: (tabId: string) => void
  setActiveTerminalTab: (tabId: string) => void
  
  // Debug Actions
  toggleBreakpoint: (file: string, line: number) => void
  startDebugSession: () => void
  stopDebugSession: () => void
  
  // API Actions
  addApiRequest: (request: APIRequest) => void
  updateApiRequest: (id: string, updates: Partial<APIRequest>) => void
  deleteApiRequest: (id: string) => void
  setActiveApiRequest: (id: string) => void
  
  // YAML Actions
  addYamlFile: (file: YamlFile) => void
  updateYamlFile: (id: string, content: string) => void
  deleteYamlFile: (id: string) => void
  setActiveYamlFile: (id: string) => void
  validateYaml: (id: string) => void
  runYaml: (id: string) => void
  uploadYamlFile: (file: File) => Promise<void>
  
  setFontSize: (size: number) => void
  setTabSize: (size: number) => void
  setMinimap: (enabled: boolean) => void
  setAutoSave: (enabled: boolean) => void
  saveFile: (tabId: string) => void
  
  // Project Actions
  setProjectRoot: (path: string | null) => void
  setProjectFiles: (files: any[]) => void
  
  // Performance Actions
  updateMetrics: (metrics: { cpu: number; memory: number; buildTime: number }) => void
  setMaxFileSize: (size: number) => void
  setSyntaxHighlighting: (level: string) => void
  setLazyLoading: (enabled: boolean) => void
  setIncrementalBuild: (enabled: boolean) => void
  setMemoryLimit: (limit: number) => void
  setBuildThreads: (threads: string) => void
  setMemoryOptimization: (enabled: boolean) => void
  setBuildCache: (enabled: boolean) => void
  clearCache: () => void
  runPerformanceTest: () => void
  optimizePerformance: () => void
  
  // Extension Actions
  setExtensionSearchQuery: (query: string) => void
  setExtensionFilter: (filter: string) => void
  toggleExtension: (id: string) => void
  updateExtension: (id: string) => void
  setAutoUpdateExtensions: (enabled: boolean) => void
  setTrustedExtensionsOnly: (enabled: boolean) => void
  setExtensionSandbox: (enabled: boolean) => void
  checkForExtensionUpdates: () => void
  
  // AI Assistant Actions
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
  
  // Notification Actions
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
  
  // Keybinding Actions
  setKeybindingPreset: (preset: string) => void
  setCustomKeybinding: (action: string, keys: string) => void
  resetKeybindings: () => void
  setVimMode: (enabled: boolean) => void
  setEmacsMode: (enabled: boolean) => void
  exportKeybindings: () => void
  importKeybindings: (bindings: Record<string, string>) => void
  
  // Theme Actions
  setTheme: (theme: string) => void
  createCustomTheme: (name: string, config: any) => void
  deleteCustomTheme: (name: string) => void
  setThemePreview: (enabled: boolean) => void
  setAutoThemeSwitch: (enabled: boolean) => void
  setLightThemeTime: (time: string) => void
  setDarkThemeTime: (time: string) => void
  exportTheme: (name: string) => void
  importTheme: (config: any) => void
  
  // Language Actions
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
  
  // Debug Actions
  setDebugAutoStart: (enabled: boolean) => void
  setDebugPort: (port: number) => void
  setDebugConsole: (enabled: boolean) => void
  setDebugBreakOnExceptions: (enabled: boolean) => void
  setDebugStepIntoLibraries: (enabled: boolean) => void
  setDebugShowInlineValues: (enabled: boolean) => void
  setDebugLogLevel: (level: string) => void
  
  // Preview Actions
  setPreviewOpen: (open: boolean) => void
  setPreviewUrl: (url: string) => void
  setPreviewMode: (mode: 'browser' | 'mobile' | 'tablet') => void
  
  // Notification helper
  sendNotification: (type: 'build' | 'error' | 'collaboration' | 'deployment', title: string, message: string) => void
  
  // Collaboration State
  collaborationUsers: CollaborationUser[]
  isConnectedToCollaboration: boolean
  
  // Collaboration Actions
  setCollaborationUsers: (users: CollaborationUser[]) => void
  addCollaborationUser: (user: CollaborationUser) => void
  removeCollaborationUser: (userId: string) => void
  setCollaborationConnection: (connected: boolean) => void
  
  // File Tree Actions
  refreshFileTree: () => void
  createFile: (parentId: string | null, name: string) => void
  createFolder: (parentId: string | null, name: string) => void
  
  // Persistence
  loadFromURL: () => void
  saveToURL: () => void
  restoreLastSession: () => void
}

export const useIDEStore = create<IDEState>()(
  devtools(
    persist(
      (set, get) => {
        const fileManager = FileTreeManager.getInstance()
        
        return {
          // Initial state
          commandPalette: false,
          aiModal: false,
          yamlModal: false,
          aiChatOpen: false,
          settingsModal: false,
          settingsOpen: false,
          globalSearch: false,
          globalSearchQuery: '',
          terminalOpen: false,
          view: 'workspace',
          previousView: 'workspace',
          collab: false,
          environment: 'production',
          activePanel: 'files',
          isRunning: false,
          runningFile: null,
          activeTab: 'sample-html',
          tabs: [
            {
              id: 'sample-html',
              name: 'index.html',
              path: '/index.html',
              content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kriya IDE Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            opacity: 0.9;
            line-height: 1.6;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .feature h3 {
            margin-top: 0;
            color: #ffd700;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Kriya IDE</h1>
        <p>Welcome to the professional web-based IDE with real-time collaboration!</p>
        
        <div class="features">
            <div class="feature">
                <h3>📝 Code Editor</h3>
                <p>Monaco-powered editor with syntax highlighting</p>
            </div>
            <div class="feature">
                <h3>🤝 Collaboration</h3>
                <p>Real-time collaborative editing across tabs</p>
            </div>
            <div class="feature">
                <h3>👁️ Live Preview</h3>
                <p>Instant preview with responsive device modes</p>
            </div>
        </div>
    </div>
    
    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            const features = document.querySelectorAll('.feature');
            features.forEach((feature, index) => {
                feature.style.animationDelay = (index * 0.2) + 's';
                feature.style.animation = 'fadeInUp 0.6s ease forwards';
            });
        });
        
        // CSS animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .feature {
                opacity: 0;
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`,
              language: 'html',
              isDirty: false,
              icon: 'ph ph-file-html'
            }
          ],
          recentFiles: [],
          fileTree: fileManager.getFileTree(),
          fileTreeVersion: 0,
          aiMessages: [],
          aiInputValue: '',
          terminalTabs: [{ id: 'bash-1', name: 'bash', type: 'bash', isActive: true }],
          activeTerminalTab: 'bash-1',
          breakpoints: {},
          debugSession: false,
          apiRequests: [],
          activeApiRequest: null,
          yamlFiles: [
            {
              id: 'instruct',
              name: 'instruct.yaml',
              path: '/instruct.yaml',
              content: `# Instruct YAML Template
# Describe what you want this YAML configuration to accomplish

name: "my-project"
description: |
  Explain what this configuration should do:
  - What services or components to set up
  - What environment or deployment target
  - What specific requirements or constraints
  - Any dependencies or integrations needed

# Example instructions:
# "Create a Docker Compose setup for a Node.js app with Redis and PostgreSQL"
# "Generate Kubernetes deployment for a microservice with auto-scaling"
# "Set up CI/CD pipeline configuration for automated testing and deployment"

instructions: |
  Write your detailed instructions here...
  
  What I want to achieve:
  - 
  - 
  - 

# Configuration preferences (optional)
preferences:
  environment: "production"  # development, staging, production
  scale: "small"            # small, medium, large
  security: "standard"      # basic, standard, high
  
# Additional context
context:
  technology_stack: []
  existing_infrastructure: ""
  constraints: ""`,
              isValid: true
            },
            {
              id: 'docker-compose',
              name: 'docker-compose.yml',
              path: '/docker-compose.yml',
              content: `version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production`,
              isValid: true
            },
            {
              id: 'kubernetes',
              name: 'kubernetes.yaml',
              path: '/k8s/deployment.yaml',
              content: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: kriya-ide\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: kriya-ide`,
              isValid: true
            }
          ],
          activeYamlFile: null,
          projectRoot: null,
          projectFiles: [],
          fontSize: 14,
          tabSize: 2,
          minimap: false,
          autoSave: false,
          cpuUsage: 45,
          memoryUsage: 67,
          buildTime: 2.3,
          maxFileSize: 50,
          syntaxHighlighting: 'Full (Recommended)',
          lazyLoading: true,
          incrementalBuild: true,
          memoryLimit: 4,
          buildThreads: 'Auto (Recommended)',
          memoryOptimization: true,
          buildCache: true,
          extensions: [
            {
              id: 'prettier',
              name: 'Prettier',
              version: '9.0.0',
              category: 'Code formatting',
              downloads: '2.1M',
              status: 'active',
              icon: 'ph-code'
            },
            {
              id: 'gitlens',
              name: 'GitLens',
              version: '13.6.0',
              category: 'Git integration',
              downloads: '15M',
              status: 'active',
              icon: 'ph-git-branch'
            },
            {
              id: 'material-theme',
              name: 'Material Theme',
              version: '34.2.1',
              category: 'Theme',
              downloads: '8.5M',
              status: 'disabled',
              icon: 'ph-palette'
            },
            {
              id: 'eslint',
              name: 'ESLint',
              version: '2.4.2',
              category: 'Linting',
              downloads: '22M',
              status: 'update-available',
              icon: 'ph-bug'
            }
          ],
          extensionSearchQuery: '',
          extensionFilter: 'All',
          autoUpdateExtensions: true,
          trustedExtensionsOnly: true,
          extensionSandbox: true,
          aiEnabled: true,
          aiModel: 'GPT-4',
          aiTemperature: 0.7,
          aiMaxTokens: 2048,
          aiAutoComplete: true,
          aiCodeSuggestions: true,
          aiErrorAnalysis: true,
          aiDocGeneration: false,
          aiPrivacyMode: false,
          aiCustomPrompts: [
            'Explain this code in simple terms',
            'Optimize this function for performance',
            'Add error handling to this code'
          ],
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
          
          // Keybinding Settings
          keybindings: {
            'save': 'Ctrl+S',
            'open': 'Ctrl+O',
            'new': 'Ctrl+N',
            'find': 'Ctrl+F',
            'replace': 'Ctrl+H',
            'commandPalette': 'Ctrl+Shift+P',
            'terminal': 'Ctrl+`',
            'run': 'F5',
            'debug': 'F9',
            'comment': 'Ctrl+/',
            'duplicate': 'Ctrl+D',
            'delete': 'Ctrl+Shift+K',
            'format': 'Shift+Alt+F',
            'goToLine': 'Ctrl+G',
            'closeTab': 'Ctrl+W',
            'nextTab': 'Ctrl+Tab',
            'prevTab': 'Ctrl+Shift+Tab',
            'splitEditor': 'Ctrl+\\',
            'toggleSidebar': 'Ctrl+B',
            'zen': 'Ctrl+K Z'
          },
          customKeybindings: {},
          keybindingPreset: 'VSCode',
          enableVimMode: false,
          enableEmacsMode: false,
          
          // Theme Settings
          currentTheme: 'Dark',
          customThemes: {},
          themePreview: false,
          autoThemeSwitch: false,
          lightThemeTime: '08:00',
          darkThemeTime: '20:00',
          
          // Language Settings
          languageSettings: {
            javascript: {
              enabled: true,
              autoDetect: true,
              formatter: 'Prettier',
              linter: 'ESLint',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: true
            },
            typescript: {
              enabled: true,
              autoDetect: true,
              formatter: 'Prettier',
              linter: 'TypeScript',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: false
            },
            python: {
              enabled: true,
              autoDetect: true,
              formatter: 'Black',
              linter: 'Pylint',
              tabSize: 4,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: false
            },
            java: {
              enabled: true,
              autoDetect: true,
              formatter: 'Google Java Format',
              linter: 'Checkstyle',
              tabSize: 4,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: false
            },
            css: {
              enabled: true,
              autoDetect: true,
              formatter: 'Prettier',
              linter: 'Stylelint',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: true
            },
            html: {
              enabled: true,
              autoDetect: true,
              formatter: 'Prettier',
              linter: 'HTMLHint',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: true
            },
            json: {
              enabled: true,
              autoDetect: true,
              formatter: 'Prettier',
              linter: 'JSON',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: false,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: false
            },
            yaml: {
              enabled: true,
              autoDetect: true,
              formatter: 'YAML',
              linter: 'YAML Lint',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: false
            },
            markdown: {
              enabled: true,
              autoDetect: true,
              formatter: 'Prettier',
              linter: 'Markdownlint',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: false,
              folding: true,
              wordWrap: true,
              emmet: false
            }
          },
          defaultLanguage: 'plaintext',
          languageAssociations: {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.css': 'css',
            '.html': 'html',
            '.json': 'json',
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.md': 'markdown'
          },
          
          // Debug Settings
          debugAutoStart: false,
          debugPort: 9229,
          debugConsole: true,
          debugBreakOnExceptions: false,
          debugStepIntoLibraries: false,
          debugShowInlineValues: true,
          debugLogLevel: 'info',
          
          // Preview Settings
          previewOpen: false,
          previewUrl: '',
          previewMode: 'browser',
          
          gitBranch: 'main',
          gitStatus: 'modified',
          uncommittedChanges: 3,
          
          // Collaboration State
          collaborationUsers: [],
          isConnectedToCollaboration: false,
          
          // Actions
          setCommandPalette: (open) => set({ commandPalette: open }),
          setCommandPaletteOpen: (open) => set({ commandPalette: open }),
          setSidebarOpen: (open) => { 
            const newValue = typeof open === 'function' ? open(get().activePanel !== '') : open
            set({ activePanel: newValue ? 'files' : '' })
          },
          setAIModal: (open) => set({ aiModal: open }),
          setYamlModal: (open) => set({ yamlModal: open }),
          setAIChatOpen: (open) => set({ aiChatOpen: open }),
          setSettingsModal: (open) => set({ settingsModal: open }),
          setSettingsOpen: (open) => set({ settingsOpen: open }),
          setGlobalSearch: (open) => set({ globalSearch: open }),
          setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
          setTerminalOpen: (open) => set({ terminalOpen: open }),
          setView: (view) => {
            set((state) => {
              const newState = { 
                previousView: state.view !== 'settings' ? state.view : state.previousView,
                view 
              }
              // Update URL when view changes
              setTimeout(() => get().saveToURL(), 0)
              return newState
            })
          },
                    setCollab: (collab) => {
            set({ collab })
            
            // When enabling collaboration, sync current document
            if (collab && typeof window !== 'undefined') {
              const state = get()
              const activeTabData = state.tabs.find(tab => tab.id === state.activeTab)
              if (activeTabData) {
                const { collaborationService } = require('@/lib/collaboration-service')
                collaborationService.joinDocument('shared-document', 'live')
                
                // Send current content to other tabs
                setTimeout(() => {
                  collaborationService.sendOperation({
                    type: 'replace',
                    content: activeTabData.content,
                    position: 0
                  })
                }, 200)
              }
            }
          },
          setEnvironment: (environment) => set({ environment }),
          setActivePanel: (panel) => {
            set({ activePanel: panel })
            // Update URL when panel changes
            setTimeout(() => get().saveToURL(), 0)
          },
          setActiveTab: (tabId) => {
            set({ activeTab: tabId })
            // Update URL when tab changes
            const { saveToURL } = get()
            saveToURL()
          },
          
          runCurrentFile: () => {
            const state = get()
            if (!state.activeTab) return
            
            const activeTabData = state.tabs.find(tab => tab.id === state.activeTab)
            if (!activeTabData) return
            
            // Check if it's a YAML file
            const isYamlFile = activeTabData.language === 'yaml' || 
                              activeTabData.name.endsWith('.yml') || 
                              activeTabData.name.endsWith('.yaml')
            
            if (isYamlFile) {
              // Find corresponding YAML file and run it
              const yamlFile = state.yamlFiles.find(f => f.id === activeTabData.id || f.path === activeTabData.path)
              if (yamlFile) {
                get().runYaml(yamlFile.id)
              }
            } else {
              // Run regular file
              set({ isRunning: true, runningFile: activeTabData.id })
              
              // Send notification
              get().sendNotification('build', 'Running File', `Executing ${activeTabData.name}`)
              
              // Simulate execution
              setTimeout(() => {
                const success = Math.random() > 0.2 // 80% success rate
                set({ isRunning: false, runningFile: null })
                
                if (success) {
                  get().sendNotification('build', 'Execution Complete', `${activeTabData.name} executed successfully`)
                } else {
                  get().sendNotification('error', 'Execution Failed', `Error executing ${activeTabData.name}`)
                }
              }, 2000)
            }
          },
          
          addTab: (file) => {
            set((state) => {
              const existingTab = state.tabs.find(tab => tab.path === file.path)
              if (existingTab) {
                // Update URL when switching to existing tab
                setTimeout(() => get().saveToURL(), 0)
                return { activeTab: existingTab.id }
              }
              // Update URL when adding new tab
              setTimeout(() => get().saveToURL(), 0)
              return {
                tabs: [...state.tabs, file],
                activeTab: file.id
              }
            })
          },
          
          closeTab: (tabId) => {
            set((state) => {
              const newTabs = state.tabs.filter(tab => tab.id !== tabId)
              let newActiveTab = state.activeTab
              
              if (state.activeTab === tabId && newTabs.length > 0) {
                // Find the index of the closed tab to select the next appropriate tab
                const closedTabIndex = state.tabs.findIndex(tab => tab.id === tabId)
                const nextIndex = Math.min(closedTabIndex, newTabs.length - 1)
                newActiveTab = newTabs[nextIndex].id
              } else if (newTabs.length === 0) {
                newActiveTab = null
              }
              
              // Update URL after tab change
              setTimeout(() => get().saveToURL(), 0)
              
              return { tabs: newTabs, activeTab: newActiveTab }
            })
          },
          
              updateTabContent: (tabId, content) => {
    set((state) => {
      const updatedTabs = state.tabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, content, isDirty: false }
          : tab
      )
      
      return { tabs: updatedTabs }
    })
    
    // Send collaboration update after state update to avoid circular dependency
    const state = get()
    if (state.collab && typeof window !== 'undefined') {
      const { collaborationService } = require('@/lib/collaboration-service')
      collaborationService.sendOperation({
        type: 'replace',
        content: content,
        position: 0
      })
    }
  },
          
          // Terminal Actions
          addTerminalTab: (tab) => set((state) => ({
            terminalTabs: [...state.terminalTabs.map(t => ({ ...t, isActive: false })), tab],
            activeTerminalTab: tab.id
          })),
          
          closeTerminalTab: (tabId) => set((state) => {
            const newTabs = state.terminalTabs.filter(tab => tab.id !== tabId)
            let newActiveTab = state.activeTerminalTab
            
            if (state.activeTerminalTab === tabId && newTabs.length > 0) {
              newActiveTab = newTabs[0].id
              newTabs[0].isActive = true
            } else if (newTabs.length === 0) {
              newActiveTab = null
            }
            
            return { terminalTabs: newTabs, activeTerminalTab: newActiveTab }
          }),
          
          setActiveTerminalTab: (tabId) => set((state) => ({
            terminalTabs: state.terminalTabs.map(tab => ({ ...tab, isActive: tab.id === tabId })),
            activeTerminalTab: tabId
          })),
          
          // Debug Actions
          toggleBreakpoint: (file, line) => set((state) => {
            const fileBreakpoints = state.breakpoints[file] || []
            const hasBreakpoint = fileBreakpoints.includes(line)
            
            return {
              breakpoints: {
                ...state.breakpoints,
                [file]: hasBreakpoint 
                  ? fileBreakpoints.filter(l => l !== line)
                  : [...fileBreakpoints, line].sort((a, b) => a - b)
              }
            }
          }),
          
          startDebugSession: () => set({ debugSession: true }),
          stopDebugSession: () => set({ debugSession: false }),
          
          // API Actions
          addApiRequest: (request) => set((state) => ({
            apiRequests: [...state.apiRequests, request],
            activeApiRequest: request.id
          })),
          
          updateApiRequest: (id, updates) => set((state) => ({
            apiRequests: state.apiRequests.map(req => 
              req.id === id ? { ...req, ...updates } : req
            )
          })),
          
          deleteApiRequest: (id) => set((state) => ({
            apiRequests: state.apiRequests.filter(req => req.id !== id),
            activeApiRequest: state.activeApiRequest === id ? null : state.activeApiRequest
          })),
          
          setActiveApiRequest: (id) => set({ activeApiRequest: id }),
          
          // YAML Actions
          addYamlFile: (file) => set((state) => ({
            yamlFiles: [...state.yamlFiles, file],
            activeYamlFile: file.id
          })),
          
          updateYamlFile: (id, content) => set((state) => ({
            yamlFiles: state.yamlFiles.map(file => 
              file.id === id ? { ...file, content, isValid: true } : file
            )
          })),
          
          deleteYamlFile: (id) => set((state) => ({
            yamlFiles: state.yamlFiles.filter(file => file.id !== id),
            activeYamlFile: state.activeYamlFile === id ? null : state.activeYamlFile
          })),
          
          setActiveYamlFile: (id) => set({ activeYamlFile: id }),
          
          validateYaml: (id) => set((state) => {
            const file = state.yamlFiles.find(f => f.id === id)
            if (!file) return state
            
            try {
              const lines = file.content.split('\n')
              const errors: string[] = []
              
              lines.forEach((line, index) => {
                if (line.trim() && !line.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*/) && !line.match(/^\s*-\s*/)) {
                  if (!line.match(/^\s*#/) && line.trim() !== '') {
                    errors.push(`Line ${index + 1}: Invalid YAML syntax`)
                  }
                }
              })
              
              return {
                yamlFiles: state.yamlFiles.map(f => 
                  f.id === id ? { ...f, isValid: errors.length === 0, errors } : f
                )
              }
            } catch (error) {
              return {
                yamlFiles: state.yamlFiles.map(f => 
                  f.id === id ? { ...f, isValid: false, errors: ['Invalid YAML format'] } : f
                )
              }
            }
          }),
          
          runYaml: (id) => {
            const file = get().yamlFiles.find(f => f.id === id)
            if (!file) return
            
            // Set running state
            set((state) => ({
              yamlFiles: state.yamlFiles.map(f => 
                f.id === id ? { ...f, isRunning: true, runStatus: 'running' as const } : f
              )
            }))
            
            // Send start notification
            get().sendNotification('deployment', 'YAML Execution Started', `Running ${file.name}`)
            
            // Simulate execution with animation
            setTimeout(() => {
              const success = Math.random() > 0.2 // 80% success rate
              set((state) => ({
                yamlFiles: state.yamlFiles.map(f => 
                  f.id === id ? { 
                    ...f, 
                    isRunning: false, 
                    runStatus: success ? 'success' as const : 'error' as const,
                    lastRun: new Date()
                  } : f
                )
              }))
              
              // Send completion notification
              if (success) {
                get().sendNotification('deployment', 'YAML Execution Complete', `${file.name} executed successfully`)
              } else {
                get().sendNotification('error', 'YAML Execution Failed', `Error executing ${file.name}`)
              }
            }, 2000)
          },
          
          uploadYamlFile: async (file: File) => {
            try {
              const content = await file.text()
              const newYamlFile = {
                id: `uploaded-${Date.now()}`,
                name: file.name,
                path: `/${file.name}`,
                content,
                isValid: true
              }
              
              set((state) => ({
                yamlFiles: [...state.yamlFiles, newYamlFile],
                activeYamlFile: newYamlFile.id
              }))
              
              // Also add to editor tabs
              const { addTab } = get()
              addTab({
                id: newYamlFile.id,
                name: newYamlFile.name,
                path: newYamlFile.path,
                content: newYamlFile.content,
                language: 'yaml',
                isDirty: false,
                icon: 'ph-fill ph-file-text'
              })
            } catch (error) {
              console.error('Failed to upload YAML file:', error)
            }
          },
          
          // AI Chat Actions
          addAIMessage: (message) => set((state) => ({
            aiMessages: [...state.aiMessages, {
              ...message,
              id: Date.now().toString(),
              timestamp: new Date()
            }]
          })),
          
          setAIInputValue: (value) => set({ aiInputValue: value }),
          
          clearAIChat: () => set({ aiMessages: [], aiInputValue: '' }),
          
          setFontSize: (size) => set({ fontSize: size }),
          setTabSize: (size) => set({ tabSize: size }),
          setMinimap: (enabled) => set({ minimap: enabled }),
          setAutoSave: (enabled) => set({ autoSave: enabled }),
          
          saveFile: (tabId) => {
            set((state) => {
              const updatedTabs = state.tabs.map(tab => 
                tab.id === tabId 
                  ? { ...tab, isDirty: false }
                  : tab
              )
              
              // Add to recent files
              const savedTab = state.tabs.find(tab => tab.id === tabId)
              if (savedTab) {
                const recentFiles = [savedTab.path, ...state.recentFiles.filter(path => path !== savedTab.path)].slice(0, 10)
                return { tabs: updatedTabs, recentFiles }
              }
              
              return { tabs: updatedTabs }
            })
          },
          
          // Project Actions
          setProjectRoot: (path) => set({ projectRoot: path }),
          setProjectFiles: (files) => set({ projectFiles: files }),
          
          // Performance Actions
          updateMetrics: (metrics) => set({ 
            cpuUsage: metrics.cpu, 
            memoryUsage: metrics.memory, 
            buildTime: metrics.buildTime 
          }),
          
          setMaxFileSize: (size) => set({ maxFileSize: size }),
          setSyntaxHighlighting: (level) => set({ syntaxHighlighting: level }),
          setLazyLoading: (enabled) => set({ lazyLoading: enabled }),
          setIncrementalBuild: (enabled) => set({ incrementalBuild: enabled }),
          setMemoryLimit: (limit) => set({ memoryLimit: limit }),
          setBuildThreads: (threads) => set({ buildThreads: threads }),
          setMemoryOptimization: (enabled) => set({ memoryOptimization: enabled }),
          setBuildCache: (enabled) => set({ buildCache: enabled }),
          
          clearCache: () => {
            console.log('Cache cleared')
            set((state) => ({ buildTime: Math.max(0.5, state.buildTime - 0.5) }))
          },
          
          runPerformanceTest: () => {
            console.log('Running performance test...')
            setTimeout(() => {
              set({ 
                cpuUsage: Math.floor(Math.random() * 30) + 20,
                memoryUsage: Math.floor(Math.random() * 40) + 30,
                buildTime: Math.random() * 2 + 1
              })
            }, 2000)
          },
          
          optimizePerformance: () => {
            console.log('Optimizing performance...')
            set((state) => ({
              cpuUsage: Math.max(10, state.cpuUsage - 15),
              memoryUsage: Math.max(20, state.memoryUsage - 20),
              buildTime: Math.max(0.8, state.buildTime - 0.8)
            }))
            
            // Send notification about optimization
            get().sendNotification('build', 'Performance Optimized', 'System performance has been improved')
          },
          
          // Extension Actions
          setExtensionSearchQuery: (query) => set({ extensionSearchQuery: query }),
          setExtensionFilter: (filter) => set({ extensionFilter: filter }),
          
          toggleExtension: (id) => set((state) => ({
            extensions: state.extensions.map(ext => 
              ext.id === id 
                ? { ...ext, status: ext.status === 'active' ? 'disabled' : 'active' }
                : ext
            )
          })),
          
          updateExtension: (id) => set((state) => ({
            extensions: state.extensions.map(ext => 
              ext.id === id 
                ? { ...ext, status: 'active', version: '(updated)' }
                : ext
            )
          })),
          
          setAutoUpdateExtensions: (enabled) => set({ autoUpdateExtensions: enabled }),
          setTrustedExtensionsOnly: (enabled) => set({ trustedExtensionsOnly: enabled }),
          setExtensionSandbox: (enabled) => set({ extensionSandbox: enabled }),
          
          checkForExtensionUpdates: () => {
            console.log('Checking for extension updates...')
            setTimeout(() => {
              const updatesFound = Math.floor(Math.random() * 3) + 1
              set((state) => ({
                extensions: state.extensions.map(ext => 
                  Math.random() > 0.7 
                    ? { ...ext, status: 'update-available' }
                    : ext
                )
              }))
              
              // Send notification about updates
              get().sendNotification('build', 'Extension Updates Available', `${updatesFound} extension updates found`)
            }, 1000)
          },
          
          // AI Assistant Actions
          setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
          setAiModel: (model) => set({ aiModel: model }),
          setAiTemperature: (temp) => set({ aiTemperature: temp }),
          setAiMaxTokens: (tokens) => set({ aiMaxTokens: tokens }),
          setAiAutoComplete: (enabled) => set({ aiAutoComplete: enabled }),
          setAiCodeSuggestions: (enabled) => set({ aiCodeSuggestions: enabled }),
          setAiErrorAnalysis: (enabled) => set({ aiErrorAnalysis: enabled }),
          setAiDocGeneration: (enabled) => set({ aiDocGeneration: enabled }),
          setAiPrivacyMode: (enabled) => set({ aiPrivacyMode: enabled }),
          
          addCustomPrompt: (prompt) => set((state) => ({
            aiCustomPrompts: [...state.aiCustomPrompts, prompt]
          })),
          
          removeCustomPrompt: (index) => set((state) => ({
            aiCustomPrompts: state.aiCustomPrompts.filter((_, i) => i !== index)
          })),
          
          testAiConnection: () => {
            console.log('Testing AI connection...')
            // Simulate connection test
            setTimeout(() => {
              console.log('AI connection successful')
            }, 1500)
          },
          
          // Notification Actions
          setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
          setDesktopNotifications: (enabled) => {
            if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                  set({ desktopNotifications: permission === 'granted' })
                })
                return
              } else if (Notification.permission === 'denied') {
                set({ desktopNotifications: false })
                return
              }
            }
            set({ desktopNotifications: enabled })
          },
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
          
          testNotification: () => {
            const state = get()
            if (!state.desktopNotifications) return
            
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                const notification = new Notification('Kriya IDE Test', {
                  body: 'Notifications are working correctly!',
                  icon: '/favicon.ico'
                })
                
                if (state.soundEnabled && state.notificationVolume > 0) {
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
                  audio.volume = state.notificationVolume
                  audio.play().catch(() => {})
                }
                
                setTimeout(() => notification.close(), 5000)
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    set({ desktopNotifications: true })
                    get().testNotification()
                  } else {
                    set({ desktopNotifications: false })
                  }
                })
              }
            }
          },
          
          setKeybindingPreset: (preset) => {
            const presets = {
              'VSCode': {
                'save': 'Ctrl+S', 'open': 'Ctrl+O', 'new': 'Ctrl+N', 'find': 'Ctrl+F',
                'replace': 'Ctrl+H', 'commandPalette': 'Ctrl+Shift+P', 'terminal': 'Ctrl+`',
                'run': 'F5', 'debug': 'F9', 'comment': 'Ctrl+/', 'duplicate': 'Ctrl+D',
                'delete': 'Ctrl+Shift+K', 'format': 'Shift+Alt+F', 'goToLine': 'Ctrl+G',
                'closeTab': 'Ctrl+W', 'nextTab': 'Ctrl+Tab', 'prevTab': 'Ctrl+Shift+Tab',
                'splitEditor': 'Ctrl+\\', 'toggleSidebar': 'Ctrl+B', 'zen': 'Ctrl+K Z'
              },
              'Sublime': {
                'save': 'Ctrl+S', 'open': 'Ctrl+O', 'new': 'Ctrl+N', 'find': 'Ctrl+F',
                'replace': 'Ctrl+H', 'commandPalette': 'Ctrl+Shift+P', 'terminal': 'Ctrl+Shift+`',
                'run': 'Ctrl+B', 'debug': 'F9', 'comment': 'Ctrl+/', 'duplicate': 'Ctrl+Shift+D',
                'delete': 'Ctrl+Shift+K', 'format': 'Ctrl+Shift+F', 'goToLine': 'Ctrl+G',
                'closeTab': 'Ctrl+W', 'nextTab': 'Ctrl+PageDown', 'prevTab': 'Ctrl+PageUp',
                'splitEditor': 'Alt+Shift+2', 'toggleSidebar': 'Ctrl+K Ctrl+B', 'zen': 'Shift+F11'
              },
              'Atom': {
                'save': 'Ctrl+S', 'open': 'Ctrl+O', 'new': 'Ctrl+N', 'find': 'Ctrl+F',
                'replace': 'Ctrl+Shift+F', 'commandPalette': 'Ctrl+Shift+P', 'terminal': 'Ctrl+Shift+`',
                'run': 'Ctrl+R', 'debug': 'F5', 'comment': 'Ctrl+/', 'duplicate': 'Ctrl+Shift+D',
                'delete': 'Ctrl+Shift+K', 'format': 'Ctrl+Alt+B', 'goToLine': 'Ctrl+G',
                'closeTab': 'Ctrl+W', 'nextTab': 'Ctrl+PageDown', 'prevTab': 'Ctrl+PageUp',
                'splitEditor': 'Ctrl+Shift+L', 'toggleSidebar': 'Ctrl+\\', 'zen': 'Ctrl+Shift+F11'
              }
            }
            
            set({ 
              keybindingPreset: preset,
              keybindings: presets[preset as keyof typeof presets] || presets.VSCode
            })
          },
          
          setCustomKeybinding: (action, keys) => set((state) => ({
            customKeybindings: { ...state.customKeybindings, [action]: keys },
            keybindings: { ...state.keybindings, [action]: keys }
          })),
          
          resetKeybindings: () => {
            const { setKeybindingPreset } = get()
            setKeybindingPreset('VSCode')
            set({ customKeybindings: {} })
          },
          
          setVimMode: (enabled) => set({ enableVimMode: enabled, enableEmacsMode: enabled ? false : get().enableEmacsMode }),
          setEmacsMode: (enabled) => set({ enableEmacsMode: enabled, enableVimMode: enabled ? false : get().enableVimMode }),
          
          exportKeybindings: () => {
            const { keybindings, customKeybindings } = get()
            const data = JSON.stringify({ keybindings, customKeybindings }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'kriya-keybindings.json'
            a.click()
            URL.revokeObjectURL(url)
          },
          
          importKeybindings: (bindings) => set((state) => ({
            customKeybindings: { ...state.customKeybindings, ...bindings },
            keybindings: { ...state.keybindings, ...bindings }
          })),
          
          // Theme Actions
          setTheme: (theme) => set({ currentTheme: theme }),
          
          createCustomTheme: (name, config) => set((state) => ({
            customThemes: { ...state.customThemes, [name]: config }
          })),
          
          deleteCustomTheme: (name) => set((state) => {
            const { [name]: deleted, ...rest } = state.customThemes
            return { customThemes: rest }
          }),
          
          setThemePreview: (enabled) => set({ themePreview: enabled }),
          setAutoThemeSwitch: (enabled) => set({ autoThemeSwitch: enabled }),
          setLightThemeTime: (time) => set({ lightThemeTime: time }),
          setDarkThemeTime: (time) => set({ darkThemeTime: time }),
          
          exportTheme: (name) => {
            const { customThemes } = get()
            const theme = customThemes[name]
            if (theme) {
              const data = JSON.stringify({ [name]: theme }, null, 2)
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${name}-theme.json`
              a.click()
              URL.revokeObjectURL(url)
            }
          },
          
          importTheme: (config) => set((state) => ({
            customThemes: { ...state.customThemes, ...config }
          })),
          
          // Language Actions
          setLanguageEnabled: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], enabled }
            }
          })),
          
          setLanguageAutoDetect: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], autoDetect: enabled }
            }
          })),
          
          setLanguageFormatter: (language, formatter) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], formatter }
            }
          })),
          
          setLanguageLinter: (language, linter) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], linter }
            }
          })),
          
          setLanguageTabSize: (language, size) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], tabSize: size }
            }
          })),
          
          setLanguageInsertSpaces: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], insertSpaces: enabled }
            }
          })),
          
          setLanguageTrimWhitespace: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], trimWhitespace: enabled }
            }
          })),
          
          setLanguageInsertFinalNewline: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], insertFinalNewline: enabled }
            }
          })),
          
          setLanguageServer: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], languageServer: enabled }
            }
          })),
          
          setLanguageSnippets: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], snippets: enabled }
            }
          })),
          
          setLanguageAutoComplete: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], autoComplete: enabled }
            }
          })),
          
          setLanguageBracketMatching: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], bracketMatching: enabled }
            }
          })),
          
          setLanguageFolding: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], folding: enabled }
            }
          })),
          
          setLanguageWordWrap: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], wordWrap: enabled }
            }
          })),
          
          setLanguageEmmet: (language, enabled) => set((state) => ({
            languageSettings: {
              ...state.languageSettings,
              [language]: { ...state.languageSettings[language], emmet: enabled }
            }
          })),
          
          setDefaultLanguage: (language) => set({ defaultLanguage: language }),
          
          addLanguageAssociation: (extension, language) => set((state) => ({
            languageAssociations: { ...state.languageAssociations, [extension]: language }
          })),
          
          removeLanguageAssociation: (extension) => set((state) => {
            const { [extension]: removed, ...rest } = state.languageAssociations
            return { languageAssociations: rest }
          }),
          
          resetLanguageSettings: (language) => {
            const defaultSettings = {
              enabled: true,
              autoDetect: true,
              formatter: 'Default',
              linter: 'Default',
              tabSize: 2,
              insertSpaces: true,
              trimWhitespace: true,
              insertFinalNewline: true,
              languageServer: true,
              snippets: true,
              autoComplete: true,
              bracketMatching: true,
              folding: true,
              wordWrap: false,
              emmet: false
            }
            
            set((state) => ({
              languageSettings: {
                ...state.languageSettings,
                [language]: defaultSettings
              }
            }))
          },
          
          // Debug Actions
          setDebugAutoStart: (enabled) => set({ debugAutoStart: enabled }),
          setDebugPort: (port) => set({ debugPort: port }),
          setDebugConsole: (enabled) => set({ debugConsole: enabled }),
          setDebugBreakOnExceptions: (enabled) => set({ debugBreakOnExceptions: enabled }),
          setDebugStepIntoLibraries: (enabled) => set({ debugStepIntoLibraries: enabled }),
          setDebugShowInlineValues: (enabled) => set({ debugShowInlineValues: enabled }),
          setDebugLogLevel: (level) => set({ debugLogLevel: level }),
          
          // Preview Actions
          setPreviewOpen: (open) => set({ previewOpen: open }),
          setPreviewUrl: (url) => set({ previewUrl: url }),
          setPreviewMode: (mode) => set({ previewMode: mode }),
          
          sendNotification: (type, title, message) => {
            const state = get()
            
            // Check if notifications are enabled
            if (!state.notificationsEnabled || !state.desktopNotifications) return
            
            // Check event type settings
            const eventTypeMap = {
              build: state.buildNotifications,
              error: state.errorNotifications,
              collaboration: state.collaborationNotifications,
              deployment: state.deploymentNotifications
            }
            
            if (!eventTypeMap[type]) return
            
            // Check quiet hours
            if (state.quietHours) {
              const now = new Date()
              const currentTime = now.getHours() * 60 + now.getMinutes()
              const [startHour, startMin] = state.quietStart.split(':').map(Number)
              const [endHour, endMin] = state.quietEnd.split(':').map(Number)
              const startTime = startHour * 60 + startMin
              const endTime = endHour * 60 + endMin
              
              if (startTime <= endTime) {
                if (currentTime >= startTime && currentTime <= endTime) return
              } else {
                if (currentTime >= startTime || currentTime <= endTime) return
              }
            }
            
            // Send browser notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                tag: type
              })
              
              // Play sound if enabled
              if (state.soundEnabled && state.notificationVolume > 0) {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
                audio.volume = state.notificationVolume
                audio.play().catch(() => {})
              }
              
              setTimeout(() => notification.close(), 5000)
            }
          },
          
          // Git Actions
          setGitBranch: (branch: string) => set({ gitBranch: branch }),
          setGitStatus: (status: 'clean' | 'modified' | 'staged' | 'committed') => set({ gitStatus: status }),
          setUncommittedChanges: (count: number) => set({ uncommittedChanges: count }),
          
          // Collaboration Actions
          setCollaborationUsers: (users) => set({ collaborationUsers: users }),
          addCollaborationUser: (user) => set((state) => ({
            collaborationUsers: [...state.collaborationUsers, user]
          })),
          removeCollaborationUser: (userId) => set((state) => ({
            collaborationUsers: state.collaborationUsers.filter(u => u.id !== userId)
          })),
          setCollaborationConnection: (connected) => set({ isConnectedToCollaboration: connected }),
          
          // File Tree Actions
          refreshFileTree: () => set((state) => ({
            fileTree: fileManager.getFileTree(),
            fileTreeVersion: state.fileTreeVersion + 1
          })),
          
          createFile: (parentId, name) => {
            const newFile = fileManager.addFile(parentId, name)
            if (newFile) {
              const getFileContent = (filename: string): string => {
                const contentMap: Record<string, string> = {
                  'MainEditor.tsx': `'use client'\n\nimport { useEffect, useRef } from 'react'\n\nexport default function MainEditor() {\n  return <div>Editor</div>\n}`,
                  'package.json': `{\n  "name": "kriya-ide",\n  "version": "0.1.0"\n}`,
                  'README.md': `# ${filename.replace('.md', '')}\n\nFile description here...`
                }
                return contentMap[filename] || `// ${filename}\n\n// File content here...`
              }
              
              const getLanguage = (filename: string): string => {
                const ext = filename.split('.').pop()?.toLowerCase()
                const langMap: Record<string, string> = {
                  'tsx': 'typescript', 'ts': 'typescript', 'js': 'javascript', 'jsx': 'javascript',
                  'css': 'css', 'json': 'json', 'md': 'markdown'
                }
                return langMap[ext || ''] || 'plaintext'
              }
              
              const newTab = {
                id: newFile.id,
                name: newFile.name,
                path: newFile.path,
                content: getFileContent(newFile.name),
                language: getLanguage(newFile.name),
                isDirty: false,
                icon: fileManager.getFileIcon(newFile.name)
              }
              
              set((state) => ({
                fileTree: fileManager.getFileTree(),
                fileTreeVersion: state.fileTreeVersion + 1,
                tabs: [...state.tabs, newTab],
                activeTab: newTab.id
              }))
            }
          },
          
          createFolder: (parentId, name) => {
            fileManager.addFolder(parentId, name)
            set((state) => ({
              fileTree: fileManager.getFileTree(),
              fileTreeVersion: state.fileTreeVersion + 1
            }))
          },
          
          // Persistence
          loadFromURL: () => {
            if (typeof window === 'undefined') return
            
            try {
              const params = new URLSearchParams(window.location.search)
              const state = get()
              
              const view = params.get('view')
              const panel = params.get('panel')
              const tab = params.get('tab')
              const search = params.get('search')
              const terminal = params.get('terminal')
              
              // Validate and apply URL parameters
              if (view && ['workspace', 'settings', 'preview'].includes(view) && view !== state.view) {
                set({ view })
              }
              
              if (panel && ['files', 'search', 'git', 'debug', 'extensions', 'docker', 'database', 'api', 'yaml'].includes(panel) && panel !== state.activePanel) {
                set({ activePanel: panel })
              }
              
              if (tab && state.tabs.find(t => t.id === tab) && tab !== state.activeTab) {
                set({ activeTab: tab })
              }
              
              if (search && search.length <= 100) { // Prevent excessively long search queries
                set({ globalSearchQuery: search, globalSearch: true })
              }
              
              if (terminal === 'true') {
                set({ terminalOpen: true })
              }
            } catch (error) {
              console.warn('Failed to load state from URL:', error)
            }
          },
          
          saveToURL: () => {
            if (typeof window === 'undefined') return
            
            try {
              const state = get()
              const params = new URLSearchParams()
              
              if (state.view && state.view !== 'workspace') {
                params.set('view', state.view)
              }
              
              if (state.activePanel && state.activePanel !== 'files') {
                params.set('panel', state.activePanel)
              }
              
              if (state.activeTab) {
                params.set('tab', state.activeTab)
              }
              
              if (state.globalSearchQuery && state.globalSearchQuery.trim()) {
                params.set('search', state.globalSearchQuery.trim())
              }
              
              if (state.terminalOpen) {
                params.set('terminal', 'true')
              }
              
              const newURL = params.toString() 
                ? `${window.location.pathname}?${params.toString()}` 
                : window.location.pathname
                
              window.history.replaceState({}, '', newURL)
            } catch (error) {
              console.warn('Failed to save state to URL:', error)
            }
          },
          
          restoreLastSession: () => {
            const state = get()
            if (state.recentFiles.length > 0 && state.tabs.length === 0) {
              // Try to restore last active file if it exists in file tree
              const lastFile = state.recentFiles[0]
              // This would need file tree integration to check if file exists
            }
          }
        }
      },
      {
        name: 'kriya-ide-storage',
        partialize: (state: IDEState) => ({
          tabs: state.tabs,
          activeTab: state.activeTab,
          recentFiles: state.recentFiles,
          terminalTabs: state.terminalTabs,
          activeTerminalTab: state.activeTerminalTab,
          breakpoints: state.breakpoints,
          apiRequests: state.apiRequests,
          activeApiRequest: state.activeApiRequest,
          yamlFiles: state.yamlFiles,
          activeYamlFile: state.activeYamlFile,
          fontSize: state.fontSize,
          tabSize: state.tabSize,
          minimap: state.minimap,
          autoSave: state.autoSave,
          view: state.view,
          activePanel: state.activePanel,
          environment: state.environment,
          collab: state.collab,
          terminalOpen: state.terminalOpen
        })
      }
    )
  )
)

// Expose store globally for collaboration service
if (typeof window !== 'undefined') {
  (window as any).useIDEStore = useIDEStore
}