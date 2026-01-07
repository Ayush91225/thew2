import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const TIMEOUT = 10000

interface ExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
}

const LANGUAGE_CONFIGS = {
  javascript: {
    extension: '.js',
    command: (file: string) => `node "${file}"`,
  },
  python: {
    extension: '.py',
    command: (file: string) => `python3 "${file}"`,
  },
  html: {
    extension: '.html',
    command: null,
  },
  css: {
    extension: '.css',
    command: null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, language, filename } = await request.json()
    
    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language required' }, { status: 400 })
    }

    const config = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]
    if (!config) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
    }

    if (language === 'html' || language === 'css') {
      return NextResponse.json({
        success: true,
        output: 'File ready for preview. Use live server to view.',
        executionTime: 0
      })
    }

    const result = await executeCode(code, language, filename || 'temp', config)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Execution error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Execution failed' 
    }, { status: 500 })
  }
}

async function executeCode(
  code: string, 
  language: string, 
  filename: string, 
  config: any
): Promise<ExecutionResult> {
  const startTime = Date.now()
  
  try {
    const tempFile = path.join(WORKSPACE_DIR, `${filename}${config.extension}`)
    await fs.mkdir(path.dirname(tempFile), { recursive: true })
    await fs.writeFile(tempFile, code, 'utf-8')

    if (!config.command) {
      return { success: true, output: 'File saved successfully', executionTime: Date.now() - startTime }
    }

    const { stdout, stderr } = await execAsync(config.command(tempFile), {
      timeout: TIMEOUT,
      cwd: WORKSPACE_DIR
    })

    await fs.unlink(tempFile).catch(() => {})

    return {
      success: !stderr,
      output: stdout || stderr,
      executionTime: Date.now() - startTime
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Execution failed',
      executionTime: Date.now() - startTime
    }
  }
}