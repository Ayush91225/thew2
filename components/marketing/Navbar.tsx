'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CaretRight } from 'phosphor-react'
import KriyaLogo from '@/components/logo/KriyaLogo'

export default function Navbar() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <KriyaLogo className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 font-sans">
                        KRIYA
                    </span>
                </Link>

                {/* Navigation */}
                <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5">
                    {[
                        { name: 'Home', path: '/' },
                        { name: 'Team', path: '/team' },
                        { name: 'Docs', path: '/docs' },
                    ].map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive(item.path)
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Auth Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/ide"
                        className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-blue-50 transition-all duration-300"
                    >
                        Launch IDE
                        <CaretRight weight="bold" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </nav>
    )
}
