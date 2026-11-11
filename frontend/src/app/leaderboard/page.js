'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Avatar from '@/components/Avatar';
import { Trophy, Award, Flame, CheckCircle2, Star, Sparkles, Filter } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

export default function LeaderboardPage() {
  const [data, setData] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = async (cohortId) => {
    try {
      const res = await api.getLeaderboard(cohortId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedCohort);
  }, [selectedCohort]);

  const rows = data?.rows || [];
  const top3 = data?.top3 || [];
  const cohort = data?.cohort;
  const myRow = data?.me;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-indigo-500/20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Header Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-200 border border-white/10 text-xs font-semibold text-amber-400">
            <Trophy size={14} /> Official Cohort Standings
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Platform Leaderboard
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gamified performance tracking derived from verified activity: 60% assessment accuracy, 25% curriculum completion, and 15% learning consistency.
          </p>
        </div>

        {/* Formula Explanation Banner */}
        <div className="p-4 rounded-2xl bg-surface-200 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-indigo-400 shrink-0" />
            <span className="text-slate-300">
              <strong className="text-white">Fair Competition Formula:</strong> Total = (Assessment × 0.60) + (Completion × 0.25) + (Consistency × 0.15)
            </span>
          </div>
          {cohort && (
            <span className="px-3 py-1 rounded-lg bg-surface-300 border border-white/5 font-mono text-indigo-300 text-[11px] shrink-0">
              {cohort.name} ({cohort.program})
            </span>
          )}
        </div>

        {/* Top 3 Podium Cards */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-end">
            {/* Rank 2 - Silver */}
            <div className="card-base p-6 text-center space-y-3 order-2 md:order-1 border-slate-400/30">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/10 text-slate-300 font-bold font-mono text-xs border border-slate-300/30">
                #2
              </div>
              <div className="flex justify-center">
                <Avatar avatar={top3[1]?.avatar} name={top3[1]?.name} size={64} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{top3[1]?.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{top3[1]?.archetype || 'Learner'}</span>
              </div>
              <p className="text-xl font-extrabold text-slate-200 font-mono">
                {Math.round(top3[1]?.score || 0)} <span className="text-xs font-normal text-slate-400">pts</span>
              </p>
            </div>

            {/* Rank 1 - Gold (Elevated) */}
            <div className="card-base p-7 text-center space-y-4 order-1 md:order-2 border-amber-500/40 shadow-glow-primary -translate-y-2 bg-gradient-to-b from-surface-200 via-surface-200 to-amber-950/20">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono text-sm border border-amber-500/40">
                👑 #1
              </div>
              <div className="flex justify-center">
                <Avatar avatar={top3[0]?.avatar} name={top3[0]?.name} size={76} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{top3[0]?.name}</h3>
                <span className="text-[11px] text-amber-400 font-medium">{top3[0]?.archetype || 'Top Performer'}</span>
              </div>
              <p className="text-2xl font-black text-amber-300 font-mono">
                {Math.round(top3[0]?.score || 0)} <span className="text-xs font-normal text-slate-400">pts</span>
              </p>
            </div>

            {/* Rank 3 - Bronze */}
            <div className="card-base p-6 text-center space-y-3 order-3 border-amber-700/30">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/10 text-amber-600 font-bold font-mono text-xs border border-amber-700/30">
                #3
              </div>
              <div className="flex justify-center">
                <Avatar avatar={top3[2]?.avatar} name={top3[2]?.name} size={64} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{top3[2]?.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{top3[2]?.archetype || 'Learner'}</span>
              </div>
              <p className="text-xl font-extrabold text-amber-600 font-mono">
                {Math.round(top3[2]?.score || 0)} <span className="text-xs font-normal text-slate-400">pts</span>
              </p>
            </div>
          </div>
        )}

        {/* Full Standings Table */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Complete Cohort Rankings ({rows.length})
            </h3>
          </div>

          <div className="table-container bg-surface-300/40">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Learner</th>
                  <th>Total Score</th>
                  <th>Assessment (60%)</th>
                  <th>Completion (25%)</th>
                  <th>Consistency (15%)</th>
                  <th>Badges</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr 
                    key={row.id || row._id}
                    className={row.isYou ? 'bg-indigo-950/30 font-medium border-l-2 border-indigo-500' : ''}
                  >
                    <td className="font-mono text-xs font-bold text-slate-300">
                      #{row.rank}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar avatar={row.avatar} name={row.name} size={32} />
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            {row.name}
                            {row.isYou && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-mono">YOU</span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-400">{row.archetype || 'Consistent Learner'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-white font-mono text-sm">
                      {Math.round(row.score)}
                    </td>
                    <td className="text-slate-300 font-mono">{Math.round(row.assessment || 0)}%</td>
                    <td className="text-slate-300 font-mono">{Math.round(row.completion || 0)}%</td>
                    <td className="text-slate-300 font-mono">{Math.round(row.consistency || 0)}%</td>
                    <td>
                      <span className="text-xs text-amber-400 font-mono flex items-center gap-1">
                        <Award size={13} /> {row.badgesCount || (row.badges?.length) || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
