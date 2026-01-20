'use client'

import { useState } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export default function AdminView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = (credentials: { email: string; password: string }) => {
    if (credentials.email && credentials.password) {
      setIsAuthenticated(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard />
}
