'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart3, Users, BookOpen, Target } from '@/components/Icons';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminAnalytics()
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading analytics insights...</div>;
  }

  const scoreDist = data?.scoreDistribution || [];
  const weekly = data?.weeklyActive || [];
  const completions = data?.completionsByType || {};

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-white/5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart3 size={16} className="text-cyan-400" /> Platform & Cohort Analytics
        </h2>
        <p className="text-xs text-slate-400">Quantitative insights on student engagement, assessment distribution, and submissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="card-base p-6 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5">
            Student Score Distribution
          </h3>
          <div className="space-y-3 pt-2">
            {scoreDist.map((bucket, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{bucket.range}</span>
                  <span className="text-white font-medium">{bucket.count} learners ({bucket.pct}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${bucket.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completions by Resource Type */}
        <div className="card-base p-6 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5">
            Completions by Resource Type
          </h3>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-surface-300 text-center space-y-1">
              <span className="text-xs text-slate-400">Videos</span>
              <p className="text-2xl font-bold text-indigo-400">{completions.videos || 0}</p>
              <span className="text-[10px] text-slate-500">Watched</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-300 text-center space-y-1">
              <span className="text-xs text-slate-400">Quizzes</span>
              <p className="text-2xl font-bold text-cyan-400">{completions.quizzes || 0}</p>
              <span className="text-[10px] text-slate-500">Attempts</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-300 text-center space-y-1">
              <span className="text-xs text-slate-400">Projects</span>
              <p className="text-2xl font-bold text-emerald-400">{completions.projects || 0}</p>
              <span className="text-[10px] text-slate-500">Evaluated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
