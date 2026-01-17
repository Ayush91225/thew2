interface ExtensionManifest {
  id: string
  name: string
  version: string
  main: string
  activationEvents: string[]
  contributes: {
    commands?: Array<{
      command: string
      title: string
    }>
    keybindings?: Array<{
      command: string
      key: string
    }>
    languages?: Array<{
      id: string
      extensions: string[]
    }>
  }
}

interface ExtensionContext {
  subscriptions: Array<() => void>
  workspaceState: Map<string, any>
  globalState: Map<string, any>
}

interface ExtensionAPI {
  commands: {
    registerCommand: (command: string, callback: Function) => void
    executeCommand: (command: string, ...args: any[]) => Promise<any>
  }
  workspace: {
    onDidChangeTextDocument: (callback: Function) => void
    getConfiguration: (section?: string) => any
  }
  window: {
    showInformationMessage: (message: string) => void
    showErrorMessage: (message: string) => void
  }
}

class ExtensionManager {
  private static instance: ExtensionManager
  private loadedExtensions = new Map<string, any>()
  private extensionContexts = new Map<string, ExtensionContext>()
  private commands = new Map<string, Function>()

  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager()
    }
    return ExtensionManager.instance
  }

  async loadExtension(extensionId: string): Promise<boolean> {
    try {
      const manifest = await this.getExtensionManifest(extensionId)
      if (!manifest) return false

      const context: ExtensionContext = {
        subscriptions: [],
        workspaceState: new Map(),
        globalState: new Map()
      }

      const api: ExtensionAPI = {
        commands: {
          registerCommand: (command: string, callback: Function) => {
            this.commands.set(command, callback)
            context.subscriptions.push(() => this.commands.delete(command))
          },
          executeCommand: async (command: string, ...args: any[]) => {
            const callback = this.commands.get(command)
            if (callback) {
              return await callback(...args)
            }
            throw new Error(`Command ${command} not found`)
          }
        },
        workspace: {
          onDidChangeTextDocument: (callback: Function) => {
            if (typeof window !== 'undefined') {
              const listener = (event: Event) => callback(event)
              window.addEventListener('editorChange' as any, listener)
              context.subscriptions.push(() => 
                window.removeEventListener('editorChange' as any, listener)
              )
            }
          },
          getConfiguration: () => ({})
        },
        window: {
          showInformationMessage: (message: string) => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('showToast', {
                detail: { type: 'success', title: 'Extension', message }
              }))
            }
          },
          showErrorMessage: (message: string) => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('showToast', {
                detail: { type: 'error', title: 'Extension Error', message }
              }))
            }
          }
        }
      }

      const extension = await this.loadExtensionCode(extensionId, manifest)
      if (extension && extension.activate) {
        await extension.activate(context, api)
        this.loadedExtensions.set(extensionId, extension)
        this.extensionContexts.set(extensionId, context)
        return true
      }

      return false
    } catch (error) {
      console.error(`Failed to load extension ${extensionId}:`, error)
      return false
    }
  }

  async unloadExtension(extensionId: string): Promise<boolean> {
    try {
      const extension = this.loadedExtensions.get(extensionId)
      const context = this.extensionContexts.get(extensionId)

      if (extension && extension.deactivate) {
        await extension.deactivate()
      }

      if (context) {
        context.subscriptions.forEach(dispose => dispose())
      }

      this.loadedExtensions.delete(extensionId)
      this.extensionContexts.delete(extensionId)
      return true
    } catch (error) {
      console.error(`Failed to unload extension ${extensionId}:`, error)
      return false
    }
  }

  private async getExtensionManifest(extensionId: string): Promise<ExtensionManifest | null> {
    const manifests: Record<string, ExtensionManifest> = {
      'prettier': {
        id: 'prettier',
        name: 'Prettier',
        version: '1.0.0',
        main: 'prettier-extension.js',
        activationEvents: ['onLanguage:javascript', 'onLanguage:typescript'],
        contributes: {
          commands: [{ command: 'prettier.format', title: 'Format Document' }],
          keybindings: [{ command: 'prettier.format', key: 'shift+alt+f' }]
        }
      },
      'live-server': {
        id: 'live-server',
        name: 'Live Server',
        version: '1.0.0',
        main: 'live-server-extension.js',
        activationEvents: ['onLanguage:html'],
        contributes: {
          commands: [
            { command: 'liveServer.start', title: 'Start Live Server' },
            { command: 'liveServer.stop', title: 'Stop Live Server' }
          ]
        }
      }
    }

    return manifests[extensionId] || null
  }

  private async loadExtensionCode(extensionId: string, manifest: ExtensionManifest): Promise<any> {
    const extensions: Record<string, any> = {
      'prettier': {
        activate: async (context: ExtensionContext, api: ExtensionAPI) => {
          api.commands.registerCommand('prettier.format', async () => {
            api.window.showInformationMessage('✨ Prettier: Document formatted successfully!')
            
            // Dispatch custom event to trigger actual formatting
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('extensionFormat', {
                detail: { extension: 'prettier', action: 'format' }
              }))
            }
          })
        },
        deactivate: async () => console.log('Prettier extension deactivated')
      },
      'live-server': {
        activate: async (context: ExtensionContext, api: ExtensionAPI) => {
          let serverRunning = false
          
          api.commands.registerCommand('liveServer.start', async () => {
            if (!serverRunning) {
              serverRunning = true
              api.window.showInformationMessage('🚀 Live Server: Started on http://localhost:5500')
            } else {
              api.window.showInformationMessage('⚠️ Live Server: Already running')
            }
          })
          
          api.commands.registerCommand('liveServer.stop', async () => {
            if (serverRunning) {
              serverRunning = false
              api.window.showInformationMessage('🛑 Live Server: Stopped')
            } else {
              api.window.showInformationMessage('⚠️ Live Server: Not running')
            }
          })
        },
        deactivate: async () => console.log('Live Server extension deactivated')
      }
    }

    return extensions[extensionId] || null
  }

  async executeCommand(command: string, ...args: any[]): Promise<any> {
    const callback = this.commands.get(command)
    if (callback) {
      return await callback(...args)
    }
    throw new Error(`Command ${command} not found`)
  }

  getLoadedExtensions(): string[] {
    return Array.from(this.loadedExtensions.keys())
  }
}

export const extensionManager = ExtensionManager.getInstance()
export type { ExtensionManifest, ExtensionContext, ExtensionAPI }