'use client'

import Navbar from '@/components/marketing/Navbar'
import Footer from '@/components/marketing/Footer'
import { Book, Code, Terminal, Cloud, Shield } from 'phosphor-react'

const docsSections = [
    {
        title: 'Getting Started',
        icon: Book,
        items: ['Introduction', 'Quick Start Guide', 'Installation', 'Architecture']
    },
    {
        title: 'Core Concepts',
        icon: Code,
        items: ['Workspaces', 'Editors', 'Extensions', 'Keybindings']
    },
    {
        title: 'CLI Reference',
        icon: Terminal,
        items: ['Commands', 'Configuration', 'Plugins', 'Automation']
    },
    {
        title: 'Deployment',
        icon: Cloud,
        items: ['Deploying Apps', 'Environment Variables', 'Custom Domains', 'Scaling']
    },
    {
        title: 'Security',
        icon: Shield,
        items: ['Authentication', 'Permissions', 'Network Policies', 'Audit Logs']
    }
]

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <Navbar />

            <main className="pt-24 min-h-screen flex flex-col md:flex-row max-w-7xl mx-auto">
                {/* Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0 border-r border-white/10 hidden md:block pt-8 pr-8 h-[calc(100vh-6rem)] sticky top-24 overflow-y-auto">
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">Documentation</h3>
                        <ul className="space-y-1">
                            {docsSections.map((section) => (
                                <li key={section.title}>
                                    <a href={`#${section.title.toLowerCase().replace(' ', '-')}`} className="block px-2 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-1 px-6 md:px-12 py-8">
                    <div className="mb-12 border-b border-white/10 pb-8">
                        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
                        <p className="text-xl text-zinc-400">
                            Learn how to build, deploy, and scale with KRIYA.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="p-6 rounded-xl bg-blue-900/10 border border-blue-500/20">
                            <h3 className="font-semibold text-blue-300 mb-2">New to KRIYA?</h3>
                            <p className="text-sm text-zinc-400 mb-4">Start here to understand the basics of cloud development.</p>
                            <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                Read the Guide &rarr;
                            </a>
                        </div>
                        <div className="p-6 rounded-xl bg-purple-900/10 border border-purple-500/20">
                            <h3 className="font-semibold text-purple-300 mb-2">API Reference</h3>
                            <p className="text-sm text-zinc-400 mb-4">Detailed documentation for the KRIYA API and SDKs.</p>
                            <a href="#" className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                View API Docs &rarr;
                            </a>
                        </div>
                    </div>

                    <div className="space-y-12">
                        {docsSections.map((section) => (
                            <section key={section.title} id={section.title.toLowerCase().replace(' ', '-')}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <section.icon className="w-6 h-6 text-zinc-300" />
                                    </div>
                                    <h2 className="text-2xl font-bold">{section.title}</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {section.items.map((item) => (
                                        <a
                                            key={item}
                                            href="#"
                                            className="group p-4 rounded-lg bg-zinc-900/30 border border-white/5 hover:border-blue-500/30 hover:bg-blue-900/5 transition-all"
                                        >
                                            <h4 className="font-medium text-zinc-200 group-hover:text-blue-300 transition-colors mb-1">{item}</h4>
                                            <p className="text-sm text-zinc-500">Learn about {item.toLowerCase()} in KRIYA.</p>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
