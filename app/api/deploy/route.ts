import { NextRequest, NextResponse } from 'next/server'

const handleError = (message: string, status = 500) => 
  NextResponse.json({ error: message }, { status })

const MOCK_DEPLOYMENTS = [
  {
    id: 'dep_1',
    environment: 'production',
    branch: 'main',
    status: 'success',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    duration: 142,
    url: 'https://kriya-ide.vercel.app'
  },
  {
    id: 'dep_2',
    environment: 'staging',
    branch: 'develop',
    status: 'success',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    duration: 98,
    url: 'https://staging.kriya-ide.vercel.app'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { environment, branch, projectId } = body

    if (!environment || !branch) {
      return handleError('Environment and branch are required', 400)
    }

    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 2000))

    const deploymentId = `dep_${Date.now()}`
    
    return NextResponse.json({
      success: true,
      deployment: {
        id: deploymentId,
        environment,
        branch,
        projectId,
        status: 'building',
        createdAt: new Date().toISOString(),
        url: environment === 'production' 
          ? 'https://kriya-ide.vercel.app'
          : `https://${environment}.kriya-ide.vercel.app`
      }
    })
  } catch {
    return handleError('Deployment failed')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment')
    
    const filtered = environment 
      ? MOCK_DEPLOYMENTS.filter(d => d.environment === environment)
      : MOCK_DEPLOYMENTS

    return NextResponse.json({
      deployments: filtered,
      total: filtered.length
    })
  } catch {
    return handleError('Failed to get deployments')
  }
}