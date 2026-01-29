'use client'

import Navbar from '@/components/marketing/Navbar'
import Footer from '@/components/marketing/Footer'
import { motion } from 'framer-motion'
import { LinkedinLogo, TwitterLogo, GithubLogo } from 'phosphor-react'

const members = [
    {
        name: 'Sarah Chen',
        role: 'Co-Founder & CEO',
        bio: 'Ex-Google engineer with a passion for developer tools and distributed systems.',
        color: 'from-blue-500 to-indigo-500'
    },
    {
        name: 'Michael Ross',
        role: 'CTO',
        bio: 'Architecting high-performance cloud infrastructure. Previously at AWS.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        name: 'Alex Kim',
        role: 'Head of Product',
        bio: 'Product visionary obsessed with user experience and seamless workflows.',
        color: 'from-orange-500 to-red-500'
    },
    {
        name: 'David Okafor',
        role: 'Lead Engineer',
        bio: 'Rust enthusiast and backend wizard ensuring our systems never sleep.',
        color: 'from-green-500 to-emerald-500'
    },
    {
        name: 'Emily Zhang',
        role: 'Design Lead',
        bio: 'Crafting beautiful, intuitive interfaces that developers love to use.',
        color: 'from-cyan-500 to-blue-500'
    },
    {
        name: 'James Wilson',
        role: 'Developer Advocate',
        bio: 'Building community and helping developers succeed with Kriya.',
        color: 'from-yellow-400 to-orange-500'
    }
]

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <Navbar />

            <main className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">Meet the Team</h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            We are a group of developers, designers, and dreamers building the future of coding.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {members.map((member, index) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all hover:bg-zinc-900/60"
                            >
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} mb-6 flex items-center justify-center text-2xl font-bold shadow-lg`}>
                                    {member.name.charAt(0)}
                                </div>

                                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                                <p className="text-blue-400 text-sm font-medium mb-4">{member.role}</p>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    {member.bio}
                                </p>

                                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                                        <LinkedinLogo className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                                        <TwitterLogo className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                                        <GithubLogo className="w-5 h-5" />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-24 text-center p-12 rounded-3xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10">
                        <h2 className="text-3xl font-bold mb-4">We're Hiring!</h2>
                        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                            Ready to build the next generation of developer tools? We're looking for talented engineers and designers to join us.
                        </p>
                        <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
                            View Open Positions
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
