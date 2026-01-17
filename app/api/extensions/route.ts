import { NextRequest, NextResponse } from 'next/server'
import { extensionManager } from '@/lib/extension-manager'

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

const MARKETPLACE_EXTENSIONS: Extension[] = [
  {
    id: 'prettier',
    name: 'Prettier',
    version: '9.0.0',
    category: 'Code formatting',
    downloads: '2.1M',
    status: 'active',
    icon: 'ph-code',
    description: 'Code formatter using prettier',
    author: 'Prettier',
    rating: 4.8,
    size: '2.1MB',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'gitlens',
    name: 'GitLens',
    version: '13.6.0',
    category: 'Git integration',
    downloads: '15M',
    status: 'active',
    icon: 'ph-git-branch',
    description: 'Git supercharged',
    author: 'GitKraken',
    rating: 4.9,
    size: '5.2MB',
    lastUpdated: '2024-01-20'
  },
  {
    id: 'live-server',
    name: 'Live Server',
    version: '5.7.9',
    category: 'Development',
    downloads: '12M',
    status: 'disabled',
    icon: 'ph-globe',
    description: 'Launch a development local Server',
    author: 'Ritwick Dey',
    rating: 4.5,
    size: '1.2MB',
    lastUpdated: '2024-01-12'
  },
  {
    id: 'bracket-pair',
    name: 'Bracket Pair Colorizer',
    version: '1.0.62',
    category: 'Editor Enhancement',
    downloads: '6.8M',
    status: 'disabled',
    icon: 'ph-brackets-curly',
    description: 'Colorize matching brackets',
    author: 'CoenraadS',
    rating: 4.4,
    size: '0.8MB',
    lastUpdated: '2024-01-08'
  }
]

const CATEGORIES = ['All', 'Code formatting', 'Git integration', 'Development', 'Editor Enhancement', 'Theme', 'Linting']

const handleError = (message: string, status = 500) => 
  NextResponse.json({ success: false, error: message }, { status })

function parseDownloads(downloads: string): number {
  const num = parseFloat(downloads.replace(/[KM]/g, ''))
  return downloads.includes('M') ? num * 1000000 : num * 1000
}

function sortExtensions(extensions: Extension[], sort: string): Extension[] {
  switch (sort) {
    case 'name':
      return extensions.sort((a, b) => a.name.localeCompare(b.name))
    case 'rating':
      return extensions.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    default:
      return extensions.sort((a, b) => parseDownloads(b.downloads) - parseDownloads(a.downloads))
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const category = searchParams.get('category') || 'All'
    const sort = searchParams.get('sort') || 'downloads'

    let extensions = [...MARKETPLACE_EXTENSIONS]

    if (query) {
      extensions = extensions.filter(ext => 
        ext.name.toLowerCase().includes(query) ||
        ext.description?.toLowerCase().includes(query)
      )
    }

    if (category !== 'All') {
      extensions = extensions.filter(ext => ext.category === category)
    }

    extensions = sortExtensions(extensions, sort)

    return NextResponse.json({
      success: true,
      extensions,
      total: extensions.length,
      categories: CATEGORIES
    })
  } catch {
    return handleError('Failed to fetch extensions')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, extensionId } = body

    if (!action || !extensionId) {
      return handleError('Action and extension ID required', 400)
    }

    const actions = {
      install: async () => {
        const success = await extensionManager.loadExtension(extensionId)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { success, message: success ? 'Extension installed successfully' : 'Installation failed' }
      },
      uninstall: async () => {
        const success = await extensionManager.unloadExtension(extensionId)
        await new Promise(resolve => setTimeout(resolve, 500))
        return { success, message: success ? 'Extension uninstalled successfully' : 'Uninstall failed' }
      },
      enable: async () => {
        const success = await extensionManager.loadExtension(extensionId)
        return { success, message: success ? 'Extension enabled successfully' : 'Enable failed' }
      },
      disable: async () => {
        const success = await extensionManager.unloadExtension(extensionId)
        return { success, message: success ? 'Extension disabled successfully' : 'Disable failed' }
      },
      update: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500))
        return { success: true, message: 'Extension updated successfully' }
      }
    }

    const handler = actions[action as keyof typeof actions]
    if (!handler) {
      return handleError('Invalid action', 400)
    }

    const result = await handler()
    return NextResponse.json({ ...result, extensionId })

  } catch {
    return handleError('Failed to process extension action')
  }
}