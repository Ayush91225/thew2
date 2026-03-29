"use client";

import { useEffect, useState } from "react";

const features = [
  {
    icon: "ph-fill ph-code",
    title: "Code Generation",
    desc: "Describe a feature in YAML and Kriya writes the code - components, APIs, logic - automatically.",
  },
  {
    icon: "ph-fill ph-cloud",
    title: "Infrastructure as Intent",
    desc: "Define AWS Lambda, S3, or RDS in a few lines. Kriya provisions and configures everything for you.",
  },
  {
    icon: "ph-fill ph-git-branch",
    title: "Git Automation",
    desc: "Set a commit message and push flag in YAML. Kriya handles staging, committing, and pushing to your repo.",
  },
  {
    icon: "ph-fill ph-users",
    title: "Role & Auth Setup",
    desc: "Declare roles like OWNER or EMPLOYEE and Kriya wires up JWT auth, guards, and permissions instantly.",
  },
  {
    icon: "ph-fill ph-arrows-clockwise",
    title: "Workflow Orchestration",
    desc: "Chain multiple operations - build, test, deploy - in a single YAML file and run them in sequence.",
  },
  {
    icon: "ph-fill ph-shield-check",
    title: "Safe & Reversible",
    desc: "Every YAML instruction is validated before execution. Preview changes before they are applied.",
  },
];

const steps = [
  { step: "01", label: "Write", desc: "Define your intent in a simple YAML file inside Kriya." },
  { step: "02", label: "Parse", desc: "Kriya reads and validates your instructions in real time." },
  { step: "03", label: "Execute", desc: "Code, infra, and workflows are generated and applied automatically." },
];

export default function YamlLayout() {
  const [glow, setGlow] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const glowInterval = setInterval(() => setGlow((p) => (p === 0 ? 1 : 0)), 2500);
    const visTimer = setTimeout(() => setVisible(true), 100);
    return () => { clearInterval(glowInterval); clearTimeout(visTimer); };
  }, []);

  return (
    <div className="h-full w-full bg-black overflow-y-auto font-sans relative" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-black to-black pointer-events-none" />
      <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none transition-all duration-[2500ms] ${glow ? "scale-110 opacity-100" : "scale-100 opacity-60"}`} />

      <div className={`relative z-10 max-w-5xl mx-auto px-8 py-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

        {/* COMING SOON BADGE */}
        <div className="flex justify-center mb-8">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-blue-400 border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 rounded-full" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Coming Soon
          </span>
        </div>

        {/* HERO */}
        <div className="text-center mb-20">
          <h1 className="text-white text-4xl md:text-6xl font-light tracking-[0.5em] mb-6" style={{ fontFamily: 'Rubik, sans-serif' }}>
            YAML ENGINE
          </h1>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed">
            Stop writing boilerplate. Define your application - features, infrastructure, auth, and workflows -
            in plain YAML. Kriya turns your intent into a working system.
          </p>
          <p className="text-zinc-600 mt-4 text-xs tracking-[0.3em] uppercase">
            Define &nbsp;•&nbsp; Execute &nbsp;•&nbsp; Scale
          </p>
        </div>

        {/* WHAT IS YAML */}
        <div className="mb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-blue-400 mb-3">What is it</p>
            <h2 className="text-white text-2xl font-semibold mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>YAML as a Development Language</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              In Kriya, YAML is not just a config format - it is a structured instruction layer.
              You describe <span className="text-white">what</span> you want to build, and Kriya figures out <span className="text-white">how</span> to build it.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              No more manually wiring up routes, writing repetitive auth logic, or configuring cloud resources by hand.
              One YAML file can replace hours of setup work.
            </p>
          </div>

          {/* YAML PREVIEW */}
          <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 text-zinc-500 text-xs">kriya.yaml</span>
            </div>
            <pre className="text-xs p-5 leading-relaxed font-mono overflow-x-auto">
              <span className="text-zinc-500"># Define a feature in plain YAML{"\n"}</span>
              <span className="text-blue-400">feature</span><span className="text-zinc-400">: </span><span className="text-green-400">authentication{"\n"}</span>
              <span className="text-blue-400">type</span><span className="text-zinc-400">: </span><span className="text-green-400">jwt{"\n"}</span>
              <span className="text-blue-400">roles</span><span className="text-zinc-400">:{"\n"}</span>
              <span className="text-zinc-400">  - </span><span className="text-green-400">OWNER{"\n"}</span>
              <span className="text-zinc-400">  - </span><span className="text-green-400">EMPLOYEE{"\n"}</span>
              <span className="text-zinc-500">{"\n"}# Provision cloud infra{"\n"}</span>
              <span className="text-blue-400">aws</span><span className="text-zinc-400">:{"\n"}</span>
              <span className="text-blue-400">  lambda</span><span className="text-zinc-400">:{"\n"}</span>
              <span className="text-blue-400">    name</span><span className="text-zinc-400">: </span><span className="text-green-400">createUser{"\n"}</span>
              <span className="text-blue-400">    runtime</span><span className="text-zinc-400">: </span><span className="text-green-400">nodejs{"\n"}</span>
              <span className="text-zinc-500">{"\n"}# Auto-commit to git{"\n"}</span>
              <span className="text-blue-400">git</span><span className="text-zinc-400">:{"\n"}</span>
              <span className="text-blue-400">  message</span><span className="text-zinc-400">: </span><span className="text-green-400">"Setup auth system"{"\n"}</span>
              <span className="text-blue-400">  push</span><span className="text-zinc-400">: </span><span className="text-yellow-400">true</span>
            </pre>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mb-20">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-blue-400 mb-3 text-center">How it works</p>
          <h2 className="text-white text-2xl font-semibold mb-10 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>Three Steps to Ship</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-950/50 hover:border-zinc-700 transition-colors">
                <div className="text-4xl font-light text-zinc-700 mb-4">{s.step}</div>
                <div className="text-white font-semibold mb-2">{s.label}</div>
                <div className="text-zinc-500 text-sm leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div className="mb-20">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-blue-400 mb-3 text-center">What you can do</p>
          <h2 className="text-white text-2xl font-semibold mb-10 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>Everything in One File</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="border border-zinc-800/60 rounded-xl p-5 bg-zinc-950/50 hover:border-zinc-700 transition-colors group">
                <i className={`${f.icon} text-blue-400 text-xl mb-3 block`} />
                <div className="text-white text-sm font-semibold mb-2">{f.title}</div>
                <div className="text-zinc-500 text-xs leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* COMING SOON CTA */}
        <div className="text-center border border-zinc-800/60 rounded-2xl p-12 bg-zinc-950/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-blue-400 mb-4">In Development</p>
            <h2 className="text-white text-3xl font-light tracking-wide mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>The YAML Engine is Coming</h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed mb-8">
              We are building the full YAML execution pipeline inside Kriya. Write once, ship everything -
              code, infra, auth, and git - from a single file.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
              Active development in progress
            </div>
          </div>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
