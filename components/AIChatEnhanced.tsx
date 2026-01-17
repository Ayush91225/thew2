'use client'

import { useState, useRef, useEffect } from 'react'
import { useIDEStore } from '@/stores/ide-store'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: { name: string; type: 'file' | 'codebase' }[]
}

interface ChatSession {
  id: string
  name: string
  messages: ChatMessage[]
  createdAt: Date
}

export default function AIChatEnhanced() {
  const { aiChatOpen, setAIChatOpen, tabs } = useIDEStore()
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: '1',
      name: 'General',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hi! I can help you with code review, debugging, and development questions.',
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    }
  ])
  const [activeSession, setActiveSession] = useState('1')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showFileContext, setShowFileContext] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentSession = sessions.find(s => s.id === activeSession)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      name: `Chat ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date()
    }
    setSessions(prev => [...prev, newSession])
    setActiveSession(newSession.id)
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: selectedFiles.length > 0 ? selectedFiles.map(f => ({ name: f, type: 'file' as const })) : undefined
    }

    setSessions(prev => prev.map(s => 
      s.id === activeSession 
        ? { ...s, messages: [...s.messages, userMessage] }
        : s
    ))

    setInput('')
    setSelectedFiles([])
    setIsLoading(true)

    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(input, selectedFiles),
        timestamp: new Date()
      }

      setSessions(prev => prev.map(s => 
        s.id === activeSession 
          ? { ...s, messages: [...s.messages, aiMessage] }
          : s
      ))
      setIsLoading(false)
    }, 1000 + Math.random() * 2000)
  }

  const generateAIResponse = (userInput: string, files: string[]): string => {
    const responses = [
      "I can help you with that. Let me analyze your code and provide suggestions.",
      "Based on your request, here are some recommendations.",
      "I see what you're trying to accomplish. Here's how I would approach this.",
      "Great question! Let me break this down for you.",
      "I've reviewed your code and found several areas for improvement.",
    ]
    
    let response = responses[Math.floor(Math.random() * responses.length)]
    
    if (files.length > 0) {
      response += `\n\nAnalyzed files:\n${files.map(f => `• ${f}`).join('\n')}`
    }
    
    return response
  }

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    )
  }

  if (!aiChatOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-black border-l border-zinc-800 flex flex-col z-50">
      {/* Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
            <i className="ph-fill ph-sparkle text-white text-xs"></i>
          </div>
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={createNewSession}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-800 transition"
          >
            <i className="ph ph-plus text-zinc-400 text-xs"></i>
          </button>
          <button
            onClick={() => setAIChatOpen(false)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-800 transition"
          >
            <i className="ph ph-x text-zinc-400 text-xs"></i>
          </button>
        </div>
      </div>

      {/* Session Tabs */}
      {sessions.length > 1 && (
        <div className="border-b border-zinc-800 overflow-x-auto">
          <div className="flex">
            {sessions.map(session => (
              <button
                key={session.id}
                className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-zinc-800 transition min-w-0 ${
                  activeSession === session.id 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                }`}
                onClick={() => setActiveSession(session.id)}
              >
                <span className="truncate max-w-16">{session.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {currentSession?.messages.map(message => (
          <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <i className="ph-fill ph-sparkle text-white text-xs"></i>
              </div>
            )}
            <div className={`max-w-[75%] rounded-lg p-2 text-xs ${
              message.role === 'user' 
                ? 'bg-white text-black' 
                : 'bg-zinc-900 text-white border border-zinc-800'
            }`}>
              {message.attachments && (
                <div className="mb-2 space-y-1">
                  {message.attachments.map((attachment, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] opacity-70 bg-zinc-800 rounded px-1 py-0.5">
                      <i className="ph ph-file"></i>
                      <span>{attachment.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-[9px] mt-1 opacity-50 ${
                message.role === 'user' ? 'text-black' : 'text-white'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <i className="ph ph-user text-zinc-400 text-xs"></i>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <i className="ph-fill ph-sparkle text-white text-xs"></i>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-zinc-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-zinc-400 ml-1">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Context Panel */}
      {showFileContext && (
        <div className="border-t border-zinc-800 p-3 max-h-32 overflow-y-auto bg-zinc-950">
          <div className="text-[10px] text-zinc-500 mb-2 uppercase font-mono">Add Context</div>
          <div className="space-y-1">
            <button
              onClick={() => toggleFileSelection('entire-codebase')}
              className={`w-full text-left text-xs p-2 rounded transition flex items-center gap-2 ${
                selectedFiles.includes('entire-codebase') 
                  ? 'bg-white text-black' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <i className="ph ph-code"></i>
              <span>Entire Codebase</span>
            </button>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => toggleFileSelection(tab.name)}
                className={`w-full text-left text-xs p-2 rounded transition flex items-center gap-2 ${
                  selectedFiles.includes(tab.name) 
                    ? 'bg-white text-black' 
                    : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800 p-3">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedFiles.map(file => (
              <span key={file} className="text-[9px] bg-zinc-800 text-white px-1 py-0.5 rounded flex items-center gap-1">
                {file}
                <button onClick={() => toggleFileSelection(file)} className="hover:text-zinc-300">
                  <i className="ph ph-x text-[8px]"></i>
                </button>
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask about your code..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded text-xs text-white p-2 resize-none outline-none focus:border-zinc-600 transition placeholder-zinc-500"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowFileContext(!showFileContext)}
              className={`w-6 h-6 flex items-center justify-center rounded transition ${
                showFileContext 
                  ? 'bg-white text-black' 
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              <i className="ph ph-paperclip text-xs"></i>
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-6 h-6 flex items-center justify-center rounded bg-white text-black hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ph ph-paper-plane-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}