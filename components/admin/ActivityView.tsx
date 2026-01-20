'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useAdminStore } from '@/stores/admin-store'

export default function ActivityView() {
    const { activities } = useAdminStore()

    // Group activities by date
    const groupedActivities = activities.reduce((acc: any, activity) => {
        const date = new Date(activity.timestamp).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        if (!acc[date]) acc[date] = []
        acc[date].push(activity)
        return acc
    }, {})

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-mono">System Audit Log</h2>
                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition flex items-center gap-2">
                    <i className="ph ph-download-simple"></i>
                    Export CSV
                </button>
            </div>

            <div className="space-y-8 relative">
                {Object.keys(groupedActivities).length > 0 ? (
                    <>
                        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10 z-0"></div>

                        {Object.entries(groupedActivities).map(([date, dateActivities]: [string, any], index) => (
                            <motion.div
                                key={date}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-center gap-4 mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-white/50 shadow-xl">
                                        <i className="ph ph-calendar-blank"></i>
                                    </div>
                                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider bg-black px-2">{date}</h3>
                                </div>

                                <div className="ml-5 pl-8 space-y-4">
                                    {dateActivities.map((activity: any) => (
                                        <div key={activity.id} className="glass border border-white/5 rounded-xl p-4 flex items-start gap-4 hover:border-white/10 transition group">
                                            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${activity.type === 'session' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                activity.type === 'deploy' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                    activity.type === 'file' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                        'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                }`}>
                                                <i className={`ph ${activity.type === 'session' ? 'ph-broadcast' :
                                                    activity.type === 'deploy' ? 'ph-rocket-launch' :
                                                        activity.type === 'file' ? 'ph-file-code' :
                                                            'ph-user'
                                                    }`}></i>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-white font-medium">
                                                        {activity.user} <span className="text-zinc-500 font-normal">{activity.action}</span>
                                                    </p>
                                                    <span className="text-xs text-zinc-500 font-mono" suppressHydrationWarning>
                                                        {new Date(activity.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>

                                                {(activity.team || activity.fileId) && (
                                                    <div className="flex items-center gap-3 mt-2">
                                                        {activity.team && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/5 border border-white/5 text-zinc-400">
                                                                {activity.team}
                                                            </span>
                                                        )}
                                                        {activity.fileId && (
                                                            <span className="flex items-center gap-1 text-xs text-blue-400/80">
                                                                <i className="ph ph-file-text"></i>
                                                                {activity.fileId}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-64 text-zinc-500">
                        <div className="text-center">
                            <i className="ph ph-clock-counter-clockwise text-4xl mb-4 opacity-50"></i>
                            <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
                            <p className="text-sm">System activities will appear here as they occur</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
