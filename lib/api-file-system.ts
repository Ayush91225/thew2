// API-based File System Operations
export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: Date
  children?: FileNode[]
  content?: string
}

export class APIFileSystem {
  private static instance: APIFileSystem

  static getInstance(): APIFileSystem {
    if (!APIFileSystem.instance) {
      APIFileSystem.instance = new APIFileSystem()
    }
    return APIFileSystem.instance
  }

  async listFiles(): Promise<FileNode[]> {
    try {
      const response = await fetch('/api/files?action=list')
      if (!response.ok) {
        console.warn('API response not OK:', response.status)
        return []
      }
      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.warn('Failed to list files:', error)
      return []
    }
  }

  async readFile(path: string): Promise<string> {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      if (!response.ok) throw new Error('Failed to read file')
      const data = await response.json()
      return data.content || ''
    } catch (error) {
      console.error('Failed to read file:', error)
      throw error
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content, type: 'file' })
      })
      if (!response.ok) throw new Error('Failed to write file')
    } catch (error) {
      console.error('Failed to write file:', error)
      throw error
    }
  }

  async createFile(path: string, name: string): Promise<void> {
    const fullPath = path ? `${path}/${name}` : name
    await this.writeFile(fullPath, '')
  }

  async createDirectory(path: string, name: string): Promise<void> {
    try {
      const fullPath = path ? `${path}/${name}` : name
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath, type: 'directory' })
      })
      if (!response.ok) throw new Error('Failed to create directory')
    } catch (error) {
      console.error('Failed to create directory:', error)
      throw error
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete file')
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      })
      if (!response.ok) throw new Error('Failed to rename file')
    } catch (error) {
      console.error('Failed to rename file:', error)
      throw error
    }
  }

  getLanguageFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'kt': 'kotlin',
      'swift': 'swift',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'tf': 'hcl',
      'hcl': 'hcl'
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  getFileIcon(filename: string, isDirectory: boolean = false): string {
    if (isDirectory) return 'ph-fill ph-folder'
    
    const ext = filename.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
      'js': 'ph-fill ph-file-js',
      'jsx': 'ph-fill ph-file-jsx',
      'ts': 'ph-fill ph-file-ts',
      'tsx': 'ph-fill ph-file-tsx',
      'py': 'ph-fill ph-file-py',
      'java': 'ph-fill ph-file-java',
      'html': 'ph-fill ph-file-html',
      'css': 'ph-fill ph-file-css',
      'scss': 'ph-fill ph-file-css',
      'json': 'ph-fill ph-brackets-curly',
      'md': 'ph-fill ph-file-text',
      'txt': 'ph-fill ph-file-text',
      'pdf': 'ph-fill ph-file-pdf',
      'png': 'ph-fill ph-file-image',
      'jpg': 'ph-fill ph-file-image',
      'jpeg': 'ph-fill ph-file-image',
      'gif': 'ph-fill ph-file-image',
      'svg': 'ph-fill ph-file-svg',
      'zip': 'ph-fill ph-file-zip',
      'env': 'ph-fill ph-gear-six',
      'config': 'ph-fill ph-gear-six',
      'dockerfile': 'ph-fill ph-container'
    }
    return iconMap[ext || ''] || 'ph-fill ph-file'
  }
}