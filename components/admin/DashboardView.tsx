'use client'

import React, { useState } from 'react'
import StatsCard from './StatsCard'
import { motion } from 'framer-motion'
import { useAdminStore } from '@/stores/admin-store'

interface DashboardViewProps {
    teams: any[]
}

export default function DashboardView({ teams }: DashboardViewProps) {
    const { activities } = useAdminStore()

    // Calculate stats
    const totalTeams = teams.length
    const activeTeams = teams.filter(t => t.workspace?.sharedState?.mode === 'LIVE').length
    const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)
    const activeSessions = teams.filter(t => t.workspace?.sharedState?.mode === 'LIVE').length

    // Calculate activity trend (mock logic for demo)
    const activityTrend = '+12% vs last week'

    const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')

    // Helper to generate chart data
    const getChartData = () => {
        const days = timeRange === '7d' ? 7 : 30
        const data = []
        const now = new Date()

        let maxCount = 0

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const dateStr = date.toDateString() // "Mon Jan 01 2024"

            // Count real activities
            let count = activities.filter(a => new Date(a.timestamp).toDateString() === dateStr).length

            // DEMO: Add synthetic baseline activity if real data is scarce, to make chart look alive
            if (count === 0) {
                // Deterministic "random" based on date to keep it consistent across renders
                const seed = date.getDate() + date.getMonth()
                count = Math.floor((Math.sin(seed) + 1) * 3) + 2 // Random value between 2-8
            }

            if (count > maxCount) maxCount = count

            data.push({
                date: date,
                label: days === 7
                    ? date.toLocaleDateString('en-US', { weekday: 'short' })
                    : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                count,
                rawDate: dateStr
            })
        }

        // Normalize heights to 0-100%
        return data.map(d => ({
            ...d,
            height: maxCount > 0 ? (d.count / maxCount) * 100 : 0
        }))
    }

    const chartData = getChartData()

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <StatsCard
                    title="Total Teams"
                    value={totalTeams.toString()}
                    icon="ph-users-three"
                    trend="+2"
                    trendUp={true}
                    delay={0}
                />
                <StatsCard
                    title="Active Sessions"
                    value={activeSessions.toString()}
                    icon="ph-broadcast"
                    trend="Live Now"
                    trendUp={true}
                    delay={0.1}
                />
                <StatsCard
                    title="Total Members"
                    value={totalMembers.toString()}
                    icon="ph-identification-card"
                    trend="+5"
                    trendUp={true}
                    delay={0.2}
                />
                <StatsCard
                    title="Resource Usage"
                    value="42%"
                    icon="ph-cpu"
                    trend="-3%"
                    trendUp={true}
                    description="CPU Load Average"
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-3 gap-6 h-[400px]">
                {/* Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="col-span-2 glass border-[0.5px] border-white/10 rounded-xl p-6 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <i className="ph ph-chart-line-up text-blue-400"></i>
                            Activity Overview
                        </h3>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d')}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs outline-none cursor-pointer hover:bg-white/10 transition"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>

                    <div className="flex-1 w-full h-full flex items-end justify-between px-2 gap-2 relative z-10">
                        {chartData.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end gap-2 group cursor-pointer relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl border border-white/10">
                                    {day.count} Events<br />
                                    <span className="text-zinc-400">{day.rawDate}</span>
                                </div>

                                <div
                                    className="w-full bg-blue-500/20 rounded-t-sm relative group-hover:bg-blue-500/40 transition-all duration-300"
                                    style={{ height: `${Math.max(day.height, 5)}%` }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 rounded-t-sm" />
                                </div>

                                {(timeRange === '7d' || i % 5 === 0) && (
                                    <div className="text-[10px] text-zinc-500 text-center truncate">
                                        {day.label}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none -z-10" />
                    </div>
                </motion.div>

                {/* Recent Activity List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="col-span-1 glass border-[0.5px] border-white/10 rounded-xl p-6 flex flex-col"
                >
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                        <i className="ph ph-clock-counter-clockwise text-purple-400"></i>
                        Recent Events
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                        {activities.length > 0 ? activities.slice(0, 10).map((activity, i) => (
                            <div key={activity.id} className="flex gap-3 text-sm group">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activity.type === 'session' ? 'bg-green-400 animate-pulse' :
                                        activity.type === 'deploy' ? 'bg-amber-400' :
                                            'bg-zinc-600'
                                        }`} />
                                    {i !== activities.slice(0, 10).length - 1 && (
                                        <div className="w-px h-full bg-white/5 group-hover:bg-white/10 transition-colors" />
                                    )}
                                </div>
                                <div className="pb-2">
                                    <p className="text-zinc-300">
                                        <span className="font-semibold text-white">{activity.user}</span> {activity.action}
                                    </p>
                                    <span className="text-xs text-zinc-500" suppressHydrationWarning>
                                        {new Date(activity.timestamp).toLocaleTimeString()} · {activity.team || 'System'}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="flex items-center justify-center h-32 text-zinc-500">
                                <div className="text-center">
                                    <i className="ph ph-clock-counter-clockwise text-2xl mb-2 opacity-50"></i>
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
