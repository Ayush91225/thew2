'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StatsCardProps {
    title: string
    value: string
    icon: string
    trend?: string
    trendUp?: boolean
    description?: string
    delay?: number
}

export default function StatsCard({ title, value, icon, trend, trendUp, description, delay = 0 }: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="glass border-[0.5px] border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300"
        >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className={`ph ${icon} text-4xl text-white`}></i>
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <i className={`ph ${icon} text-zinc-400`}></i>
                    </div>
                    <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{title}</span>
                </div>

                <div className="flex items-end gap-3 mb-1">
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full mb-1 ${trendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            <i className={`ph ${trendUp ? 'ph-trend-up' : 'ph-trend-down'}`}></i>
                            {trend}
                        </div>
                    )}
                </div>

                {description && (
                    <p className="text-zinc-500 text-xs">{description}</p>
                )}
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    )
}
