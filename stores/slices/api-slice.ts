import { StateCreator } from 'zustand'

export interface APIRequest {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: string
  params?: Record<string, string>
}

export interface APIResponse {
  status: number
  data: any
  time: number
  headers?: Record<string, string>
}

export interface APICollection {
  id: string
  name: string
  requestCount: number
  createdAt?: string
  updatedAt?: string
}

export interface APIEnvironment {
  id: string
  name: string
  variableCount: number
}

export interface APISlice {
  apiRequests: APIRequest[]
  activeApiRequest: string | null
  collections: APICollection[]
  environments: APIEnvironment[]
  activeEnvironment: string | null
  environmentVariables: Record<string, string>
  
  addApiRequest: (request: APIRequest) => void
  updateApiRequest: (id: string, updates: Partial<APIRequest>) => void
  deleteApiRequest: (id: string) => void
  setActiveApiRequest: (id: string | null) => void
  
  // Collection management
  loadCollections: () => Promise<void>
  saveCollection: (name: string) => Promise<void>
  loadCollection: (id: string) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  
  // Environment management
  loadEnvironments: () => Promise<void>
  setActiveEnvironment: (id: string | null) => void
  setEnvironmentVariables: (variables: Record<string, string>) => void
}

export const createAPISlice: StateCreator<any, [], [], APISlice> = (set, get, store) => ({
  apiRequests: [],
  activeApiRequest: null,
  collections: [],
  environments: [],
  activeEnvironment: null,
  environmentVariables: {},
  
  addApiRequest: (request) => set((state: APISlice) => ({
    apiRequests: [...state.apiRequests, request],
    activeApiRequest: request.id
  })),
  
  updateApiRequest: (id, updates) => set((state: APISlice) => ({
    apiRequests: state.apiRequests.map((req: APIRequest) => 
      req.id === id ? { ...req, ...updates } : req
    )
  })),
  
  deleteApiRequest: (id) => set((state: APISlice) => ({
    apiRequests: state.apiRequests.filter((req: APIRequest) => req.id !== id),
    activeApiRequest: state.activeApiRequest === id ? null : state.activeApiRequest
  })),
  
  setActiveApiRequest: (id) => set({ activeApiRequest: id }),
  
  // Collection management
  loadCollections: async () => {
    try {
      const response = await fetch('/api/collections')
      if (response.ok) {
        const data = await response.json()
        set({ collections: data.collections || [] })
      } else {
        console.warn('Collections API not available, using empty state')
        set({ collections: [] })
      }
    } catch (error) {
      console.warn('Collections API not available, using empty state')
      set({ collections: [] })
    }
  },
  
  saveCollection: async (name: string) => {
    try {
      const { apiRequests } = get()
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, requests: apiRequests })
      })
      
      if (response.ok) {
        // Reload collections
        get().loadCollections()
      }
    } catch (error) {
      console.error('Failed to save collection:', error)
    }
  },
  
  loadCollection: async (id: string) => {
    try {
      const response = await fetch(`/api/collections/${id}`)
      const data = await response.json()
      
      if (response.ok) {
        set({ 
          apiRequests: data.collection.requests,
          activeApiRequest: data.collection.requests[0]?.id || null
        })
      }
    } catch (error) {
      console.error('Failed to load collection:', error)
    }
  },
  
  deleteCollection: async (id: string) => {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Reload collections
        get().loadCollections()
      }
    } catch (error) {
      console.error('Failed to delete collection:', error)
    }
  },
  
  // Environment management
  loadEnvironments: async () => {
    try {
      const response = await fetch('/api/environments')
      if (response.ok) {
        const data = await response.json()
        set({ environments: data.environments || [] })
      } else {
        console.warn('Environments API not available, using empty state')
        set({ environments: [] })
      }
    } catch (error) {
      console.warn('Environments API not available, using empty state')
      set({ environments: [] })
    }
  },
  
  setActiveEnvironment: (id) => set({ activeEnvironment: id }),
  
  setEnvironmentVariables: (variables) => set({ environmentVariables: variables })
})