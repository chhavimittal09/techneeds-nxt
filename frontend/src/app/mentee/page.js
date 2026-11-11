'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import ScoreGauge from '@/components/ScoreGauge';
import BadgeCard from '@/components/BadgeCard';
import Avatar from '@/components/Avatar';
import { 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Trophy, 
  BookOpen, 
  Flame,
  FileText
} from '@/components/Icons';

export default function MenteeDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMenteeDashboard()
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading your learning dashboard...</div>;
  }

  const welcome = data?.welcome || {};
  const metrics = data?.metrics || {};
  const upcoming = data?.upcomingDeadlines || [];
  const recommendation = data?.recommendation;
  const recentResults = data?.recentResults || [];
  const badges = data?.badges || [];
  const leaderboard = data?.leaderboard || {};

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-200 via-surface-200 to-indigo-950/30 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar avatar={welcome.avatar} name={welcome.name} size={52} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Welcome back, {welcome.name}</h2>
              {welcome.archetype && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {welcome.archetype}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cohort: <span className="text-white font-medium">{welcome.cohort?.name}</span> ({welcome.cohort?.program})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/mentee/my-nxt"
            className="btn-primary text-xs flex items-center gap-1.5 shadow-glow-primary"
          >
            <Sparkles size={14} /> View MY NXT Profile
          </Link>
        </div>
      </div>

      {/* Main Grid: Score Gauge & Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score & Formula Gauge */}
        <div className="card-base p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Overall Performance
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">60/25/15 Formula</span>
          </div>

          <div className="py-4">
            <ScoreGauge
              score={metrics.score || 0}
              assessment={metrics.assessment || 0}
              completion={metrics.completion || 0}
              consistency={metrics.consistency || 0}
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Cohort Rank: <strong className="text-white font-mono">#{leaderboard.rank || '—'}</strong> of {leaderboard.cohortSize || '—'}</span>
            <Link href="/leaderboard" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Leaderboard <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Recommended Next Learning Activity & Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommendation Banner */}
          {recommendation && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 to-violet-950/30 border border-indigo-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} /> Recommended Next Step
                </span>
                <span className="text-[10px] text-slate-400 font-mono capitalize">{recommendation.type}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{recommendation.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{recommendation.reason}</p>
              <div className="pt-2">
                <Link
                  href={`/mentee/resources/${recommendation.id}`}
                  className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                >
                  <span>Start Activity</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-cyan-400" /> Upcoming Deadlines
              </h3>
              <Link href="/mentee/resources" className="text-xs text-slate-400 hover:text-white">
                View all deliverables
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcoming.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No pending deadlines right now.</p>
              ) : (
                upcoming.map((u) => (
                  <div key={u.id} className="p-3 rounded-xl bg-surface-300/50 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{u.title}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{u.type} • Due {new Date(u.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <Link
                      href={`/mentee/resources/${u.id}`}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      Open
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Bottom: Recent Results & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results & Feedback */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Recent Evaluations & Scores
            </h3>
            <Link href="/mentee/feedback" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Feedback history <ArrowRight size={11} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentResults.length === 0 ? (
              <p className="text-xs text-slate-400">Complete assessments to see your evaluations.</p>
            ) : (
              recentResults.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-surface-300/40 border border-white/5 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{r.title}</span>
                    <span className="font-mono text-indigo-400 font-bold">{r.marks} / {r.maxMarks} pts</span>
                  </div>
                  {r.feedback && (
                    <p className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5">
                      "{r.feedback}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Milestone Badges Preview */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Earned Milestone Badges
            </h3>
            <Link href="/mentee/my-nxt" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Full showcase <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.slice(0, 4).map((b, i) => (
              <BadgeCard key={i} badge={b} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
