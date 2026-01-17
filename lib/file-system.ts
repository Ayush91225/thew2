// Enterprise File System Operations
export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: Date
  children?: FileNode[]
  content?: string
}

export class FileSystemManager {
  private static instance: FileSystemManager
  private fileHandle: FileSystemDirectoryHandle | null = null
  private projectRoot: string = ''

  static getInstance(): FileSystemManager {
    if (!FileSystemManager.instance) {
      FileSystemManager.instance = new FileSystemManager()
    }
    return FileSystemManager.instance
  }

  async openProject(): Promise<FileNode | null> {
    try {
      if ('showDirectoryPicker' in window) {
        this.fileHandle = await (window as any).showDirectoryPicker()
        if (this.fileHandle) {
          this.projectRoot = this.fileHandle.name
          return await this.readDirectory(this.fileHandle)
        }
      } else {
        throw new Error('File System Access API not supported')
      }
    } catch (error) {
      console.error('Failed to open project:', error)
      throw error
    }
    return null
  }

  async readDirectory(dirHandle: FileSystemDirectoryHandle, path = ''): Promise<FileNode> {
    const children: FileNode[] = []
    
    for await (const [name, handle] of (dirHandle as any).entries()) {
      const fullPath = path ? `${path}/${name}` : name
      
      if (handle.kind === 'directory') {
        const subDir = await this.readDirectory(handle, fullPath)
        children.push(subDir)
      } else {
        const file = await handle.getFile()
        children.push({
          name,
          path: fullPath,
          type: 'file',
          size: file.size,
          modified: new Date(file.lastModified)
        })
      }
    }

    return {
      name: dirHandle.name,
      path,
      type: 'directory',
      children: children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.fileHandle) throw new Error('No project opened')
    
    try {
      const pathParts = path.split('/').filter(Boolean)
      let currentHandle: any = this.fileHandle
      
      for (const part of pathParts.slice(0, -1)) {
        currentHandle = await currentHandle.getDirectoryHandle(part)
      }
      
      const fileHandle = await currentHandle.getFileHandle(pathParts[pathParts.length - 1])
      const file = await fileHandle.getFile()
      return await file.text()
    } catch (error) {
      console.error('Failed to read file:', error)
      throw error
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.fileHandle) throw new Error('No project opened')
    
    try {
      const pathParts = path.split('/').filter(Boolean)
      let currentHandle: any = this.fileHandle
      
      for (const part of pathParts.slice(0, -1)) {
        try {
          currentHandle = await currentHandle.getDirectoryHandle(part)
        } catch {
          currentHandle = await currentHandle.getDirectoryHandle(part, { create: true })
        }
      }
      
      const fileHandle = await currentHandle.getFileHandle(pathParts[pathParts.length - 1], { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
    } catch (error) {
      console.error('Failed to write file:', error)
      throw error
    }
  }

  async createFile(path: string, name: string): Promise<void> {
    await this.writeFile(`${path}/${name}`, '')
  }

  async createDirectory(path: string, name: string): Promise<void> {
    if (!this.fileHandle) throw new Error('No project opened')
    
    try {
      const pathParts = path.split('/').filter(Boolean)
      let currentHandle: any = this.fileHandle
      
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part)
      }
      
      await currentHandle.getDirectoryHandle(name, { create: true })
    } catch (error) {
      console.error('Failed to create directory:', error)
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