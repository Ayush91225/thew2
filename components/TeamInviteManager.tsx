'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface TeamInviteManagerProps {
    onInviteSent?: () => void
}

export default function TeamInviteManager({ onInviteSent }: TeamInviteManagerProps) {
    const [emailInput, setEmailInput] = useState('')
    const [emails, setEmails] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const addEmail = () => {
        const email = emailInput.trim()
        if (!email) {
            setError('Please enter an email')
            return
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email')
            return
        }
        if (emails.includes(email)) {
            setError('This email is already added')
            return
        }

        setEmails([...emails, email])
        setEmailInput('')
        setError('')
    }

    const removeEmail = (email: string) => {
        setEmails(emails.filter(e => e !== email))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (emails.length === 0) {
            setError('Please add at least one email')
            return
        }

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const token = localStorage.getItem('KRIYA_TOKEN')
            
            const response = await fetch('/api/auth/invites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    action: 'create',
                    emails
                })
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Failed to send invites')
                return
            }

            setSuccess(`Successfully invited ${emails.length} user(s)`)
            setEmails([])
            onInviteSent?.()

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(''), 5000)
        } catch (err: any) {
            setError(err.message || 'Failed to send invites')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Invite Team Members</h3>
                <p className="text-sm text-zinc-400">Send invitations to join your company</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
                    >
                        {success}
                    </motion.div>
                )}

                {/* Email Input */}
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="employee@company.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                        className="flex-1 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                        type="button"
                        onClick={addEmail}
                        disabled={!emailInput || isLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors"
                    >
                        Add
                    </button>
                </div>

                {/* Email List */}
                {emails.length > 0 && (
                    <div className="space-y-2 p-4 bg-black/40 rounded-lg border border-white/5">
                        <p className="text-xs text-zinc-400 mb-3">Invites to send ({emails.length})</p>
                        {emails.map(email => (
                            <motion.div
                                key={email}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                            >
                                <span className="text-sm text-white">{email}</span>
                                <button
                                    type="button"
                                    onClick={() => removeEmail(email)}
                                    className="text-zinc-400 hover:text-red-400 transition-colors"
                                >
                                    <i className="ph ph-x text-lg"></i>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Submit Button */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading || emails.length === 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors"
                >
                    {isLoading ? 'Sending Invites...' : `Send Invite${emails.length !== 1 ? 's' : ''}`}
                </motion.button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300 leading-relaxed">
                    Invited users will receive instructions to accept the invitation and create their account. Only users with accepted invitations can log in.
                </p>
            </div>
        </div>
    )
}
