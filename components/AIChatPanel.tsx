'use client'

import { useState } from 'react'
import { useIDEStore } from '@/stores/ide-store'

export default function AIChatPanel() {
  const { 
    aiChatOpen, 
    setAIChatOpen, 
    aiMessages, 
    aiInputValue, 
    setAIInputValue, 
    addAIMessage,
    clearAIChat 
  } = useIDEStore()
  
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!aiInputValue.trim() || isLoading) return

    const userMessage = aiInputValue.trim()
    setAIInputValue('')
    
    // Add user message
    addAIMessage({
      type: 'user',
      content: userMessage
    })

    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I can help you refactor that code for better performance. Here's what I suggest...",
        "Let me analyze your code structure and provide some recommendations.",
        "I notice you're working with React components. Here are some best practices...",
        "For better TypeScript integration, consider these improvements...",
        "I can help optimize your Next.js application. Let me show you how..."
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      addAIMessage({
        type: 'assistant',
        content: randomResponse
      })
      
      setIsLoading(false)
    }, 1000 + Math.random() * 2000)
  }

  if (!aiChatOpen) return null

  return (
    <div className="w-80 border-l-line bg-black flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b-line px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <i className="ph-fill ph-sparkle text-blue-400 text-lg"></i>
          <span className="text-sm font-bold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearAIChat}
            className="text-xs text-zinc-600 hover:text-white transition"
            title="Clear chat"
          >
            <i className="ph ph-trash"></i>
          </button>
          <button 
            onClick={() => setAIChatOpen(false)}
            className="text-xs text-zinc-600 hover:text-white transition"
          >
            <i className="ph ph-x"></i>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {aiMessages.length === 0 ? (
          <div className="text-center text-zinc-600 mt-8">
            <i className="ph ph-sparkle text-3xl mb-3 text-zinc-700"></i>
            <p className="text-sm">Ask me anything about your code!</p>
            <p className="text-xs mt-2">I can help with refactoring, debugging, and optimization.</p>
          </div>
        ) : (
          aiMessages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
              {message.type === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <i className="ph-fill ph-sparkle text-white text-xs"></i>
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white ml-auto' 
                  : 'bg-zinc-800 text-zinc-200'
              }`}>
                {message.content}
              </div>
              {message.type === 'user' && (
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                  <i className="ph ph-user text-white text-xs"></i>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <i className="ph-fill ph-sparkle text-white text-xs"></i>
            </div>
            <div className="bg-zinc-800 text-zinc-200 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <i className="ph ph-spinner animate-spin"></i>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t-line p-4 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={aiInputValue}
            onChange={(e) => setAIInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask about your code..."
            disabled={isLoading}
            className="flex-1 bg-zinc-900 border-line rounded px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!aiInputValue.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ph ph-paper-plane-right"></i>
          </button>
        </div>
        <div className="text-xs text-zinc-600 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}