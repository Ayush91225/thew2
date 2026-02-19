'use client'

import { useState, useEffect } from 'react'
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })

  const getToken = () => sessionStorage.getItem('auth_token')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/employees', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (data.success) setEmployees(data.employees || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields required')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const res = await fetch('/api/auth/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (data.success) {
        setSuccess(`Employee "${formData.name}" created!`)
        setFormData({ name: '', email: '', password: '' })
        setShowForm(false)
        fetchEmployees()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to create employee')
      }
    } catch (err: any) {
      setError(err.message || 'Error creating employee')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this employee?')) return

    try {
      setLoading(true)
      const res = await fetch(`/api/auth/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('Employee deleted')
        fetchEmployees()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to delete')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

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

      {showForm && (
        <div className="bg-black border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Create New Employee</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@company.com"
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="min. 6 characters"
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-zinc-950">
          <h3 className="text-sm font-bold text-white uppercase">
            Employees ({employees.length})
          </h3>
        </div>

        {loading && !showForm ? (
          <div className="p-8 text-center text-zinc-400">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">No employees yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-950">
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300 uppercase">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-300 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-zinc-950">
                  <td className="px-4 py-3 text-white font-medium">{emp.name}</td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">
                    {new Date(emp.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(emp.id)}
                      disabled={loading}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
