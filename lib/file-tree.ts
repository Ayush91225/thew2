export interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  isExpanded?: boolean
  size?: number
  modified?: Date
}

export class FileTreeManager {
  private static instance: FileTreeManager
  private fileTree: FileTreeNode | null = null

  static getInstance(): FileTreeManager {
    if (!FileTreeManager.instance) {
      FileTreeManager.instance = new FileTreeManager()
    }
    return FileTreeManager.instance
  }

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') {
      this.initializeDefaultTree()
      return
    }
    
    try {
      const stored = localStorage.getItem('kriya-file-tree')
      if (stored) {
        this.fileTree = JSON.parse(stored)
      } else {
        this.initializeDefaultTree()
        this.saveToStorage()
      }
    } catch {
      this.initializeDefaultTree()
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined' || !this.fileTree) return
    try {
      localStorage.setItem('kriya-file-tree', JSON.stringify(this.fileTree))
    } catch {}
  }

  private initializeDefaultTree() {
    this.fileTree = {
      id: 'root',
      name: 'kriya-ide',
      path: '/',
      type: 'directory',
      isExpanded: true,
      children: [
        {
          id: 'app',
          name: 'app',
          path: '/app',
          type: 'directory',
          isExpanded: false,
          children: [
            { id: 'layout.tsx', name: 'layout.tsx', path: '/app/layout.tsx', type: 'file', size: 1024 },
            { id: 'page.tsx', name: 'page.tsx', path: '/app/page.tsx', type: 'file', size: 2048 },
            { id: 'globals.css', name: 'globals.css', path: '/app/globals.css', type: 'file', size: 512 },
            {
              id: 'api',
              name: 'api',
              path: '/app/api',
              type: 'directory',
              isExpanded: false,
              children: [
                { id: 'auth-route', name: 'route.ts', path: '/app/api/auth/route.ts', type: 'file', size: 768 },
                { id: 'search-route', name: 'route.ts', path: '/app/api/search/route.ts', type: 'file', size: 1024 }
              ]
            }
          ]
        },
        {
          id: 'components',
          name: 'components',
          path: '/components',
          type: 'directory',
          isExpanded: true,
          children: [
            { id: 'MainEditor.tsx', name: 'MainEditor.tsx', path: '/components/MainEditor.tsx', type: 'file', size: 4096 },
            { id: 'Sidebar.tsx', name: 'Sidebar.tsx', path: '/components/Sidebar.tsx', type: 'file', size: 3072 },
            { id: 'Terminal.tsx', name: 'Terminal.tsx', path: '/components/Terminal.tsx', type: 'file', size: 2560 },
            { id: 'CommandPalette.tsx', name: 'CommandPalette.tsx', path: '/components/CommandPalette.tsx', type: 'file', size: 1800 }
          ]
        },
        {
          id: 'stores',
          name: 'stores',
          path: '/stores',
          type: 'directory',
          isExpanded: false,
          children: [
            { id: 'ide-store.ts', name: 'ide-store.ts', path: '/stores/ide-store.ts', type: 'file', size: 1536 }
          ]
        },
        {
          id: 'lib',
          name: 'lib',
          path: '/lib',
          type: 'directory',
          isExpanded: false,
          children: [
            { id: 'file-system.ts', name: 'file-system.ts', path: '/lib/file-system.ts', type: 'file', size: 2048 },
            { id: 'auth-service.ts', name: 'auth-service.ts', path: '/lib/auth-service.ts', type: 'file', size: 3072 }
          ]
        },
        { id: 'package.json', name: 'package.json', path: '/package.json', type: 'file', size: 768 },
        { id: 'next.config.js', name: 'next.config.js', path: '/next.config.js', type: 'file', size: 512 },
        { id: 'README.md', name: 'README.md', path: '/README.md', type: 'file', size: 1024 }
      ]
    }
  }

  getFileTree(): FileTreeNode | null {
    return this.fileTree
  }

  toggleDirectory(nodeId: string): void {
    if (!this.fileTree) return
    this.toggleNodeExpansion(this.fileTree, nodeId)
  }

  private toggleNodeExpansion(node: FileTreeNode, targetId: string): boolean {
    if (node.id === targetId && node.type === 'directory') {
      node.isExpanded = !node.isExpanded
      return true
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (this.toggleNodeExpansion(child, targetId)) {
          return true
        }
      }
    }
    
    return false
  }

  addFile(parentId: string | null, name: string): FileTreeNode | null {
    if (!this.fileTree) return null
    
    const newFile: FileTreeNode = {
      id: `${Date.now()}-${name}`,
      name,
      path: parentId ? `${this.getNodePath(parentId)}/${name}` : `/${name}`,
      type: 'file',
      size: 0,
      modified: new Date()
    }
    
    if (parentId) {
      const parent = this.findNode(parentId)
      if (parent && parent.type === 'directory') {
        if (!parent.children) parent.children = []
        parent.children.push(newFile)
        parent.isExpanded = true
      }
    } else {
      if (!this.fileTree.children) this.fileTree.children = []
      this.fileTree.children.push(newFile)
    }
    
    this.saveToStorage()
    return newFile
  }

  addFolder(parentId: string | null, name: string): FileTreeNode | null {
    if (!this.fileTree) return null
    
    const newFolder: FileTreeNode = {
      id: `${Date.now()}-${name}`,
      name,
      path: parentId ? `${this.getNodePath(parentId)}/${name}` : `/${name}`,
      type: 'directory',
      isExpanded: false,
      children: [],
      modified: new Date()
    }
    
    if (parentId) {
      const parent = this.findNode(parentId)
      if (parent && parent.type === 'directory') {
        if (!parent.children) parent.children = []
        parent.children.push(newFolder)
        parent.isExpanded = true
      }
    } else {
      if (!this.fileTree.children) this.fileTree.children = []
      this.fileTree.children.push(newFolder)
    }
    
    this.saveToStorage()
    return newFolder
  }

  getNodeById(nodeId: string): FileTreeNode | null {
    return this.findNode(nodeId)
  }

  private getNodePath(nodeId: string): string {
    const node = this.findNode(nodeId)
    return node?.path || ''
  }

  findNode(nodeId: string): FileTreeNode | null {
    if (!this.fileTree) return null
    return this.findNodeRecursive(this.fileTree, nodeId)
  }

  private findNodeRecursive(node: FileTreeNode, targetId: string): FileTreeNode | null {
    if (node.id === targetId) return node
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeRecursive(child, targetId)
        if (found) return found
      }
    }
    
    return null
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
      'tsx': 'ph-fill ph-file-tsx',
      'ts': 'ph-fill ph-file-ts',
      'js': 'ph-fill ph-file-js',
      'jsx': 'ph-fill ph-file-jsx',
      'css': 'ph-fill ph-file-css',
      'json': 'ph-fill ph-brackets-curly',
      'md': 'ph-fill ph-file-text',
      'txt': 'ph-fill ph-file-text'
    }
    return iconMap[ext || ''] || 'ph-fill ph-file'
  }

  deleteNode(nodeId: string): boolean {
    if (!this.fileTree || !this.fileTree.children) return false
    
    const index = this.fileTree.children.findIndex(child => child.id === nodeId)
    if (index !== -1) {
      this.fileTree.children.splice(index, 1)
      this.saveToStorage()
      return true
    }
    
    for (const child of this.fileTree.children) {
      if (this.deleteNodeRecursive(child, nodeId)) {
        this.saveToStorage()
        return true
      }
    }
    
    return false
  }

  private deleteNodeRecursive(node: FileTreeNode, targetId: string): boolean {
    if (node.children) {
      const index = node.children.findIndex(child => child.id === targetId)
      if (index !== -1) {
        node.children.splice(index, 1)
        return true
      }
      
      for (const child of node.children) {
        if (this.deleteNodeRecursive(child, targetId)) {
          return true
        }
      }
    }
    return false
  }
}