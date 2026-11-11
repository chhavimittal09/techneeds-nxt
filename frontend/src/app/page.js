'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ArrowRight, 
  Sparkles, 
  Shield, 
  GraduationCap, 
  Users, 
  Trophy, 
  BookOpen, 
  CheckCircle2, 
  Code, 
  Zap, 
  Target, 
  BarChart3,
  ExternalLink
} from '@/components/Icons';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const handleQuickDemoLogin = async (identifier, password, role, targetUrl) => {
    try {
      await login({ identifier, password, role });
      router.push(targetUrl);
    } catch (e) {
      router.push(`/login?id=${encodeURIComponent(identifier)}&role=${role}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-indigo-500/20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden bg-radial-glow">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-200 border border-white/10 text-xs font-medium text-indigo-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>REIMAGATHON 2026 — Official Submission</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono text-[11px]">TECHNEEDS NXT</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Next Generation of <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Tech Mentorship.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A unified technical ecosystem built for IGDTUW engineers. Multi-tiered role hierarchies, granular resource tracking, interactive quizzes, real project evaluations, and AI-driven skill constellations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="btn-primary text-sm px-6 py-3 rounded-xl shadow-glow-primary flex items-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/leaderboard"
              className="btn-secondary text-sm px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <Trophy size={16} className="text-amber-400" />
              <span>View Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* Quick Demo Access Bar for Hackathon Judges */}
        <div className="max-w-4xl mx-auto mt-16 p-5 rounded-2xl bg-surface-200/90 border border-indigo-500/25 shadow-2xl backdrop-blur-xl relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-indigo-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                1-Click Judge Evaluation Access
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Test full end-to-end multi-role workflows instantly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <button
              onClick={() => handleQuickDemoLogin('admin@techneeds.local', 'ChangeMe-Admin-123', 'admin', '/admin')}
              className="p-3 rounded-xl bg-surface-300/80 border border-white/5 hover:border-indigo-500/40 text-left transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield size={14} className="text-indigo-400" /> Admin Portal
                </span>
                <span className="text-[10px] text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Manage programs, cohorts & mentor allocations</p>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('mentor.demo@techneeds.local', 'Demo@12345', 'mentor', '/mentor')}
              className="p-3 rounded-xl bg-surface-300/80 border border-white/5 hover:border-violet-500/40 text-left transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-violet-400" /> Mentor Panel
                </span>
                <span className="text-[10px] text-violet-400 font-medium group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Onboard mentees, publish quizzes & evaluate projects</p>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('TNX260001', 'Demo@12345', 'mentee', '/mentee')}
              className="p-3 rounded-xl bg-surface-300/80 border border-white/5 hover:border-emerald-500/40 text-left transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-400" /> Mentee Portal
                </span>
                <span className="text-[10px] text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Aarohi Sharma: Learn, attempt quizzes & view MY NXT</p>
            </button>
          </div>
        </div>
      </section>

      {/* Society Impact Metrics */}
      <section className="border-y border-white/5 bg-surface-300/50 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-3xl font-extrabold text-white tracking-tight">1,200+</span>
            <p className="text-xs text-slate-400 mt-1">IGDTUW Engineers Mentored</p>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-indigo-400 tracking-tight">98.4%</span>
            <p className="text-xs text-slate-400 mt-1">Cohort Completion Rate</p>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-violet-400 tracking-tight">3-Tier</span>
            <p className="text-xs text-slate-400 mt-1">Role Hierarchy Engine</p>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-cyan-400 tracking-tight">AI Radar</span>
            <p className="text-xs text-slate-400 mt-1">Personalized Skill Constellation</p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section id="mentorship" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Next-Gen Architecture</span>
          <h2 className="text-3xl font-bold text-white">Engineered for Technical Mastery</h2>
          <p className="text-xs text-slate-400">Everything needed to scale high-impact mentorship cohorts with full accountability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-base p-6 card-hover space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <h3 className="text-base font-semibold text-white">Multi-Panel Hierarchy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated, secure environments for Admins, Mentors, and Mentees. Program configuration, auto-generated login credentials, and cohort-specific data isolation.
            </p>
          </div>

          <div className="card-base p-6 card-hover space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-semibold text-white">MY NXT Profile Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic learner archetypes, custom SVG skill constellations, earned milestone badges, and performance recommendations derived honestly from real submission data.
            </p>
          </div>

          <div className="card-base p-6 card-hover space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <h3 className="text-base font-semibold text-white">Dynamic 60/25/15 Leaderboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent, fair gamification: 60% assessment accuracy, 25% resource completion, and 15% learning consistency. Top 3 podium celebrations and streak tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Domains Section */}
      <section id="domains" className="py-16 px-6 bg-surface-300/40 border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Curriculum Tracks</span>
              <h2 className="text-2xl font-bold text-white mt-1">TechNeeds Learning Domains</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">From fundamentals to advanced systems, cohorts progress through structured hands-on modules.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Full-Stack Web', desc: 'React, Node, Mongo', color: 'from-blue-600/20 to-indigo-600/20' },
              { name: 'Machine Learning', desc: 'PyTorch, Data Prep', color: 'from-purple-600/20 to-pink-600/20' },
              { name: 'Cloud & DevOps', desc: 'Docker, CI/CD, K8s', color: 'from-cyan-600/20 to-blue-600/20' },
              { name: 'Data Analysis', desc: 'Pandas, Visualisation', color: 'from-emerald-600/20 to-teal-600/20' },
              { name: 'App Development', desc: 'Flutter, React Native', color: 'from-amber-600/20 to-orange-600/20' },
              { name: 'Core Foundations', desc: 'C++, Data Structures', color: 'from-rose-600/20 to-red-600/20' },
            ].map((d, i) => (
              <div key={i} className={`p-4 rounded-xl bg-gradient-to-b ${d.color} border border-white/5 flex flex-col justify-between h-32`}>
                <span className="text-xs font-bold text-white leading-snug">{d.name}</span>
                <span className="text-[10px] text-slate-400">{d.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold text-white">Ready to explore the next generation?</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Explore all workflows: Program creation, resource publishing, timed quiz attempts, project evaluations, and AI profiles.
        </p>
        <Link
          href="/login"
          className="btn-primary text-sm px-8 py-3 rounded-xl shadow-glow-primary inline-flex items-center gap-2"
        >
          <span>Enter Platform</span>
          <ArrowRight size={16} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
