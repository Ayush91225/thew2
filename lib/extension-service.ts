interface Extension {
  id: string
  name: string
  version: string
  category: string
  downloads: string
  status: 'active' | 'disabled' | 'update-available'
  icon: string
  description?: string
  author?: string
  rating?: number
  size?: string
  lastUpdated?: string
}

interface ExtensionSearchParams {
  query?: string
  category?: string
  sort?: 'downloads' | 'name' | 'rating'
  installed?: boolean
}

interface ExtensionResponse {
  success: boolean
  extensions: Extension[]
  total: number
  categories: string[]
  error?: string
}

interface ExtensionActionResponse {
  success: boolean
  message: string
  extensionId: string
  error?: string
}

class ExtensionService {
  private baseUrl = '/api/extensions'

  async searchExtensions(params: ExtensionSearchParams = {}): Promise<ExtensionResponse> {
    try {
      const searchParams = new URLSearchParams()
      
      if (params.query) searchParams.set('q', params.query)
      if (params.category) searchParams.set('category', params.category)
      if (params.sort) searchParams.set('sort', params.sort)
      if (params.installed) searchParams.set('installed', 'true')

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to search extensions:', error)
      return {
        success: false,
        extensions: [],
        total: 0,
        categories: [],
        error: 'Failed to fetch extensions'
      }
    }
  }

  async installExtension(extensionId: string): Promise<ExtensionActionResponse> {
    return this.performAction('install', extensionId)
  }

  async uninstallExtension(extensionId: string): Promise<ExtensionActionResponse> {
    return this.performAction('uninstall', extensionId)
  }

  async enableExtension(extensionId: string): Promise<ExtensionActionResponse> {
    return this.performAction('enable', extensionId)
  }

  async disableExtension(extensionId: string): Promise<ExtensionActionResponse> {
    return this.performAction('disable', extensionId)
  }

  async updateExtension(extensionId: string): Promise<ExtensionActionResponse> {
    return this.performAction('update', extensionId)
  }

  private async performAction(action: string, extensionId: string): Promise<ExtensionActionResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, extensionId })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to ${action} extension:`, error)
      return {
        success: false,
        message: `Failed to ${action} extension`,
        extensionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getInstalledExtensions(): Promise<Extension[]> {
    try {
      const response = await this.searchExtensions({ installed: true })
      return response.success ? response.extensions : []
    } catch (error) {
      console.error('Failed to get installed extensions:', error)
      return []
    }
  }

  async checkForUpdates(): Promise<Extension[]> {
    try {
      const response = await this.searchExtensions()
      if (response.success) {
        return response.extensions.filter(ext => ext.status === 'update-available')
      }
      return []
    } catch (error) {
      console.error('Failed to check for updates:', error)
      return []
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await this.searchExtensions()
      return response.success ? response.categories : []
    } catch (error) {
      console.error('Failed to get categories:', error)
      return ['All']
    }
  }
}

export const extensionService = new ExtensionService()
export type { Extension, ExtensionSearchParams, ExtensionResponse, ExtensionActionResponse }