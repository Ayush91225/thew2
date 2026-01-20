'use client'

import React from 'react'
import EmployeeLayout from '@/components/employee/EmployeeLayout'
import StatsCard from '@/components/admin/StatsCard'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function EmployeePage() {
    return (
        <EmployeeLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                            My Dashboard
                        </h1>
                        <p className="text-zinc-400 mt-1">Track your performance and manage tasks</p>
                    </div>

                    <Link
                        href="/"
                        className="group"
                    >
                        <button className="px-6 py-3 bg-white text-black font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300 flex items-center gap-3">
                            <i className="ph ph-code text-lg"></i>
                            Launch IDE
                            <i className="ph ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                    <StatsCard
                        title="Weekly Hours"
                        value="32.5 hrs"
                        icon="ph-clock"
                        trend="+4.2"
                        trendUp={true}
                        delay={0}
                    />
                    <StatsCard
                        title="Performance"
                        value="94/100"
                        icon="ph-chart-line-up"
                        trend="+2pts"
                        trendUp={true}
                        delay={0.1}
                    />
                    <StatsCard
                        title="Tasks Done"
                        value="12"
                        icon="ph-check-circle"
                        trend="+3"
                        trendUp={true}
                        delay={0.2}
                    />
                    <StatsCard
                        title="Code Quality"
                        value="A+"
                        icon="ph-medal"
                        description="Top 5% of team"
                        trendUp={true}
                        delay={0.3}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-3 gap-6 h-[400px]">
                    {/* Performance Chart Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="col-span-2 glass border-[0.5px] border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col"
                    >
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                            <i className="ph ph-trend-up text-purple-400"></i>
                            Performance Trend
                        </h3>

                        <div className="flex-1 w-full flex items-end justify-between gap-4 px-4 relative z-10">
                            {[65, 72, 68, 85, 80, 92, 94].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                                    <div className="text-xs text-center text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">{h}%</div>
                                    <div
                                        className="w-full bg-purple-500/20 rounded-t-lg relative group-hover:bg-purple-500/40 transition-all duration-300"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50 rounded-t-lg shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                    </div>
                                    <div className="text-xs text-center text-zinc-500">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Tasks List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="col-span-1 glass border-[0.5px] border-white/10 rounded-xl p-6 flex flex-col"
                    >
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                            <i className="ph ph-list-checks text-blue-400"></i>
                            Pending Tasks
                        </h3>

                        <div className="space-y-3">
                            {[
                                { title: 'Fix hydration issues', priority: 'High', due: 'Today' },
                                { title: 'Update documentation', priority: 'Medium', due: 'Tomorrow' },
                                { title: 'Review PR #124', priority: 'Low', due: 'Friday' },
                            ].map((task, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition group cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-medium text-white group-hover:text-blue-200 transition">{task.title}</span>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                                task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                            }`}>{task.priority}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <i className="ph ph-calendar-blank"></i>
                                        Due {task.due}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </EmployeeLayout>
    )
}
