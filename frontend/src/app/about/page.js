import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Users, BookOpen, Trophy, Sparkles, CheckCircle2 } from '@/components/Icons';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-indigo-500/20">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 space-y-12">
        {/* Mission Statement */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            About TechNeeds IGDTUW
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Empowering the Next Generation of Women in Tech
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            TechNeeds IGDTUW is the premier core technical society of Indira Gandhi Delhi Technical University for Women. Driven by our philosophy of <span className="font-mono text-indigo-400">#all_you_need_to_know_about_tech</span>, we bridge the gap between academic curricula and production engineering.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="text-base font-semibold text-white">Peer-to-Peer Mentorship</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Senior engineering mentors provide hands-on code reviews, architecture guidance, and algorithmic mentoring to upcoming cohorts.
            </p>
          </div>

          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-semibold text-white">Real Deliverables</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Moving beyond theoretical lectures: Students construct full-stack web applications, deploy machine learning models, and build cloud microservices.
            </p>
          </div>

          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <h3 className="text-base font-semibold text-white">Transparent Recognition</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gamified progress tracking with real-time leaderboards, verified milestone badges, and AI-driven skill constellations that accurately showcase technical growth.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card-base p-8 space-y-6">
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-300 space-y-1">
              <h4 className="font-semibold text-white">What is TECHNEEDS NXT?</h4>
              <p className="text-slate-400 leading-relaxed">
                TECHNEEDS NXT is the complete redesign and reimagining of the TechNeeds IGDTUW platform, built for REIMAGATHON 2026. It features 3-tier role hierarchies, granular deliverables, and AI profiles.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-300 space-y-1">
              <h4 className="font-semibold text-white">How is the Leaderboard score calculated?</h4>
              <p className="text-slate-400 leading-relaxed">
                The score uses a strict formula: 60% assessment marks earned on quizzes and evaluated projects + 25% curriculum completion + 15% learning consistency.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-300 space-y-1">
              <h4 className="font-semibold text-white">How does the MY NXT AI Profile work?</h4>
              <p className="text-slate-400 leading-relaxed">
                MY NXT synthesizes actual user submission signals into visual archetypes, custom SVG constellations, earned badges, and growth timelines. It operates deterministically from real data with optional Claude narrative integration.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
