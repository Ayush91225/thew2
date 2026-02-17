'use client'

import React, { useState, useEffect } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'
import { Plus, Trash2, User, Mail, Lock } from 'lucide-react'

interface Employee {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
}

export default function EmployeeManagement() {
  const { user: zustandUser } = useIDEStore()
  const [user, setUser] = useState<any>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  // Get JWT token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token')
      return stored
    }
    return null
  }

  // Get user from Zustand or localStorage, with token verification fallback
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (zustandUser) {
          // User is in Zustand (logged in this session)
          setUser(zustandUser)
          setInitializing(false)
          return
        }
        
        if (typeof window !== 'undefined') {
          // Try to get from localStorage (page refresh scenario)
          const storedUser = localStorage.getItem('user')
          const token = localStorage.getItem('auth_token')
          
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser)
              
              // If user data is complete and has role, use it
              if (parsed && parsed.role) {
                setUser(parsed)
                setInitializing(false)
                return
              }
            } catch (e) {
              console.error('Failed to parse user from localStorage')
            }
          }
          
          // If we have a token but user data is incomplete, verify with backend
          if (token) {
            try {
              const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              
              const data = await response.json()
              if (data.success && data.user) {
                setUser(data.user)
                // Update localStorage with verified user data
                localStorage.setItem('user', JSON.stringify(data.user))
                setInitializing(false)
                return
              }
            } catch (err) {
              console.error('Failed to verify token:', err)
            }
          }
        }
      } finally {
        setInitializing(false)
      }
    }
    
    initializeUser()
  }, [zustandUser])

  // Fetch employees list
  useEffect(() => {
    if (user?.role === 'OWNER') {
      fetchEmployees()
    }
  }, [user])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const token = getToken()
      
      const response = await fetch('/api/auth/employees', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success) {
        setEmployees(data.employees || [])
        setError('')
      } else {
        setError(data.error || 'Failed to fetch employees')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching employees')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError('')
      const token = getToken()

      if (!token) {
        setError('Authentication token not found. Please log in again.')
        return
      }

      console.log('Creating employee with data:', { name: formData.name, email: formData.email })
      
      const response = await fetch('/api/auth/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      console.log('Response:', data)

      if (!response.ok) {
        setError(data.error || `Failed to create employee (${response.status})`)
        return
      }
      
      if (data.success) {
        setSuccess(`Employee "${formData.name}" created successfully!`)
        setFormData({ name: '', email: '', password: '' })
        setShowForm(false)
        fetchEmployees()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to create employee')
      }
    } catch (err: any) {
      console.error('Error creating employee:', err)
      setError(err.message || 'Error creating employee')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (employeeId: string) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      const token = getToken()

      const response = await fetch(`/api/auth/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Employee removed successfully')
        fetchEmployees()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to delete employee')
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting employee')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while initializing user data
  if (initializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border border-white/20 border-t-white mx-auto mb-3"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show to OWNER
  if (!user || user?.role !== 'OWNER') {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400">Only company owners can manage employees</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6" />
            Employee Management
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Create and manage employee accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Add Employee Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Create New Employee</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Employee Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@company.com"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="min. 6 characters"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Employee'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-zinc-800/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Active Employees ({employees.length})
          </h3>
        </div>

        {loading && !showForm && (
          <div className="p-8 text-center text-zinc-400">
            Loading employees...
          </div>
        )}

        {!loading && employees.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            No employees created yet. Click "Add Employee" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-800/30">
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-zinc-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr key={employee.id} className="border-b border-white/5 hover:bg-zinc-800/30 transition">
                    <td className="px-4 py-3 text-white font-medium">{employee.name}</td>
                    <td className="px-4 py-3 text-zinc-400 text-sm font-mono">{employee.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-medium">
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(employee.id)}
                        disabled={loading}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded transition disabled:opacity-50"
                        title="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
