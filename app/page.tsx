'use client'

import { motion } from 'framer-motion'
import Navbar from '@/components/marketing/Navbar'
import Footer from '@/components/marketing/Footer'
import { Rocket, Code, Users, Lightning, Globe, ShieldCheck, IconWeight } from 'phosphor-react'
import Link from 'next/link'
import KriyaLogo from '@/components/logo/KriyaLogo'

interface FeatureCardProps {
    icon: React.ComponentType<{ weight?: IconWeight; className?: string }>
    title: string
    description: string
    delay: number
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
    >
        <div className="w-12 h-12 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon weight="duotone" className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
)

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden font-display">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                            v1.0 is now live 🚀
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                            Code from anywhere,<br />
                            <span className="text-blue-400">deploy everywhere.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
                            KRIYA is the advanced cloud IDE that empowers teams to collaborate in real-time.
                            Zero setup, instant environments, and AI-powered development.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/ide"
                                className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-900/40"
                            >
                                Start Coding for Free
                            </Link>
                            <Link
                                href="/docs"
                                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-all hover:scale-105"
                            >
                                Read Documentation
                            </Link>
                        </div>
                    </motion.div>

                    {/* Hero Visual/Screenshot */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="mt-20 relative rounded-xl border border-white/10 shadow-2xl shadow-blue-900/20 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-sm z-10 flex items-center justify-center group cursor-pointer">
                            <div className="px-6 py-3 rounded-full bg-black/80 border border-white/20 text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                Launch Interactive Demo
                            </div>
                        </div>
                        {/* Placeholder for IDE Screenshot - CSS Grid Pattern for now */}
                        <div className="aspect-[16/9] bg-[#0A0A0A] p-4 font-mono text-sm text-left overflow-hidden">
                            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="grid grid-cols-12 gap-4 h-full">
                                <div className="hidden md:block col-span-2 border-r border-white/5 text-zinc-500 p-2">
                                    <div>src</div>
                                    <div className="pl-2">components</div>
                                    <div className="pl-2">utils</div>
                                    <div>package.json</div>
                                </div>
                                <div className="col-span-12 md:col-span-10 text-zinc-300">
                                    <span className="text-purple-400">import</span> <span className="text-yellow-200">{`{ useState }`}</span> <span className="text-purple-400">from</span> <span className="text-green-300">'react'</span><br />
                                    <br />
                                    <span className="text-purple-400">export default function</span> <span className="text-blue-400">App</span>() {`{`}<br />
                                    &nbsp;&nbsp;<span className="text-purple-400">const</span> [<span className="text-orange-300">count</span>, <span className="text-orange-300">setCount</span>] = <span className="text-blue-400">useState</span>(0)<br />
                                    &nbsp;&nbsp;<span className="text-zinc-500">// Welcome to KRIYA IDE</span><br />
                                    &nbsp;&nbsp;<span className="text-purple-400">return</span> (<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">div</span> className=<span className="text-green-300">&quot;ide-container&quot;</span>&gt;<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">h1</span>&gt;Hello World&lt;/<span className="text-red-400">h1</span>&gt;<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-red-400">div</span>&gt;<br />
                                    &nbsp;&nbsp;)<br />
                                    {`}`}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-zinc-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to ship</h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            Built for speed, designed for collaboration. KRIYA brings the power of a full development environment to your browser.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Rocket}
                            title="Instant Dev Environments"
                            description="Spin up a fresh container in milliseconds. No more &apos;works on my machine&apos; issues."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={Users}
                            title="Real-time Collaboration"
                            description="Code with your team in real-time. See cursors, share terminals, and debug together."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={Lightning}
                            title="AI Powered"
                            description="Built-in AI assistant to help you write, debug, and refactor code faster than ever."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Global Edge Deployment"
                            description="Deploy your applications to the edge with a single click. Global scaling included."
                            delay={0.4}
                        />
                        <FeatureCard
                            icon={Code}
                            title="Polyglot Support"
                            description="Support for TypeScript, Python, Go, Rust, and more out of the box."
                            delay={0.5}
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Enterprise Security"
                            description="SOC2 compliant, role-based access control, and secure isolated containers."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to transform your workflow?</h2>
                    <p className="text-lg text-zinc-300 mb-8">
                        Join thousands of developers building the future with KRIYA.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/ide"
                            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
                        >
                            Get Started Now
                        </Link>
                        <Link
                            href="/contact"
                            className="px-8 py-3 rounded-full bg-transparent border border-white/20 hover:bg-white/10 transition-colors"
                        >
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
