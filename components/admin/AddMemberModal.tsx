'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamName: string
  onSuccess: () => void
}

export default function AddMemberModal({ isOpen, onClose, teamId, teamName, onSuccess }: AddMemberModalProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
    }
  }, [isOpen])

  const fetchEmployees = async () => {
    try {
      const token = sessionStorage.getItem('auth_token')
      const res = await fetch('/api/auth/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const handleAdd = async () => {
    if (!selectedEmployee) return

    setLoading(true)
    try {
      const token = sessionStorage.getItem('auth_token')
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamId, employeeId: selectedEmployee })
      })

      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClose()
        setSelectedEmployee('')
      }
    } catch (error) {
      console.error('Failed to add member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Add Member to {teamName}</h2>
              <p className="text-sm text-zinc-400 mt-1">Select an employee to add to this team</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Select Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedEmployee || loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
