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

    switch (sort) {
      case 'name':
        extensions.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'rating':
        extensions.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      default:
        extensions.sort((a, b) => {
          const aDownloads = parseFloat(a.downloads.replace(/[KM]/g, '')) * (a.downloads.includes('M') ? 1000000 : 1000)
          const bDownloads = parseFloat(b.downloads.replace(/[KM]/g, '')) * (b.downloads.includes('M') ? 1000000 : 1000)
          return bDownloads - aDownloads
        })
    }

    return NextResponse.json({
      success: true,
      extensions,
      total: extensions.length,
      categories: ['All', 'Code formatting', 'Git integration', 'Development', 'Editor Enhancement', 'Theme', 'Linting']
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch extensions'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, extensionId } = body

    switch (action) {
      case 'install':
        const installSuccess = await extensionManager.loadExtension(extensionId)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return NextResponse.json({
          success: installSuccess,
          message: installSuccess ? 'Extension installed and activated successfully' : 'Failed to install extension',
          extensionId
        })

      case 'uninstall':
        const uninstallSuccess = await extensionManager.unloadExtension(extensionId)
        await new Promise(resolve => setTimeout(resolve, 500))
        return NextResponse.json({
          success: uninstallSuccess,
          message: uninstallSuccess ? 'Extension uninstalled successfully' : 'Failed to uninstall extension',
          extensionId
        })

      case 'enable':
        const enableSuccess = await extensionManager.loadExtension(extensionId)
        return NextResponse.json({
          success: enableSuccess,
          message: enableSuccess ? 'Extension enabled successfully' : 'Failed to enable extension',
          extensionId
        })

      case 'disable':
        const disableSuccess = await extensionManager.unloadExtension(extensionId)
        return NextResponse.json({
          success: disableSuccess,
          message: disableSuccess ? 'Extension disabled successfully' : 'Failed to disable extension',
          extensionId
        })

      case 'update':
        await new Promise(resolve => setTimeout(resolve, 1500))
        return NextResponse.json({
          success: true,
          message: 'Extension updated successfully',
          extensionId
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process extension action'
    }, { status: 500 })
  }
}