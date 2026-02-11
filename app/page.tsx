'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-white text-lg">Loading IDE...</div>
    </div>
  )
}
