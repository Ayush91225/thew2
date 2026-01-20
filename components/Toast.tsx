'use client'

import { useEffect, useState } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
}

export default function Toast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      console.log('Toast event received:', event.detail)
      const { type, title, message } = event.detail
      const id = Date.now().toString()
      
      setToasts(prev => {
        console.log('Adding toast, current toasts:', prev.length)
        return [...prev, { id, type, title, message }]
      })
      
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }, 4000)
    }

    console.log('Toast component mounted, adding event listener')
    window.addEventListener('showToast', handleToast as EventListener)
    return () => {
      console.log('Toast component unmounted, removing event listener')
      window.removeEventListener('showToast', handleToast as EventListener)
    }
  }, [])

  console.log('Toast render, toasts count:', toasts.length)

  return (
    <>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{toast.title}</div>
          <div style={{ fontSize: '14px' }}>{toast.message}</div>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      ))}
    </>
  )
}