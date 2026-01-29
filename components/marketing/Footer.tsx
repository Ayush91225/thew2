'use client'

import Link from 'next/link'
import { GithubLogo, TwitterLogo, DiscordLogo, Heart } from 'phosphor-react'
import KriyaLogo from '@/components/logo/KriyaLogo'

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <KriyaLogo className="w-6 h-6" />
                            <span className="text-lg font-bold text-white font-sans">KRIYA</span>
                        </Link>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            The next-generation cloud development environment. Code, collaborate, and deploy from anywhere.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li><Link href="/ide" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">IDE</Link></li>
                            <li><Link href="/team" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">Team</Link></li>
                            <li><Link href="/docs" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">Documentation</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li><Link href="/blog" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">Blog</Link></li>
                            <li><Link href="/community" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">Community</Link></li>
                            <li><Link href="/help" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li><Link href="/privacy" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-zinc-600 text-sm">
                        © {new Date().getFullYear()} Kriya Inc. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6">
                        <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                            <GithubLogo weight="fill" className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                            <TwitterLogo weight="fill" className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                            <DiscordLogo weight="fill" className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
