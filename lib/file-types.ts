// Shared types and utilities for file system operations
export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: Date
  children?: FileNode[]
  content?: string
}

export const getLanguageFromExtension = (filename: string): string => {
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

export const getFileIcon = (filename: string, isDirectory: boolean = false): string => {
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