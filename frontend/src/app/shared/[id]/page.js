'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Avatar from '@/components/Avatar';
import SkillConstellation from '@/components/SkillConstellation';
import BadgeCard from '@/components/BadgeCard';
import { Sparkles, Trophy, CheckCircle2, Shield } from '@/components/Icons';

export default function PublicSharedProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.getPublicSharedProfile(id)
        .then(setProfile)
        .catch((e) => setError(e.message || 'Profile not found or sharing disabled'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 text-xs">
        Loading verified student showcase...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-400">{error || 'Profile unavailable'}</p>
          <p className="text-xs text-slate-400">This profile link is either inactive or has sharing turned off.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const user = profile.user || {};
  const archetype = profile.archetype || {};
  const skills = profile.skills || [];
  const badges = profile.badges || [];
  const stats = profile.stats || {};
  const timeline = profile.timeline || [];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-indigo-500/20">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Verified Profile Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-surface-200 via-surface-200 to-indigo-950/40 border border-indigo-500/25 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Avatar avatar={user.avatar} name={user.name} size={76} />
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {archetype.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Track: <strong className="text-slate-200">{user.program || 'TechNeeds Mentorship'}</strong>
                </p>
                <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
                  <CheckCircle2 size={13} /> Verified TechNeeds IGDTUW Learner
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-surface-300/80 p-3.5 rounded-2xl border border-white/5">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase">Rank</span>
                <p className="text-lg font-bold text-white font-mono">#{stats.rank || '—'}</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase">Completed</span>
                <p className="text-lg font-bold text-indigo-400 font-mono">{stats.completed || 0}</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase">Streak</span>
                <p className="text-lg font-bold text-cyan-400 font-mono">{stats.streakLongest || 0}d</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {archetype.description}
            </p>
          </div>
        </div>

        {/* Constellation & Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-base p-6 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" /> Verified Skill Constellation
            </h3>
            <SkillConstellation skills={skills} />
          </div>

          <div className="card-base p-6 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" /> Milestone Badges ({badges.length})
            </h3>
            <div className="space-y-2.5">
              {badges.map((b, i) => (
                <BadgeCard key={i} badge={b} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
