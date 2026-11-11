'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  Shield, 
  Layers, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  BarChart3
} from '@/components/Icons';

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminOverview()
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading ecosystem overview...</div>;
  }

  const totals = data?.totals || {};
  const attention = data?.attention || [];
  const recent = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface-200 border border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white">Ecosystem Command Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Global monitoring, mentor allocations, and cohort governance for TechNeeds IGDTUW.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/programs" className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={14} /> New Program
          </Link>
          <Link href="/admin/mentors" className="btn-secondary text-xs flex items-center gap-1.5">
            <Plus size={14} /> Onboard Mentor
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Programs</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.programs || 0}</p>
          <span className="text-[10px] text-indigo-400 mt-1 block">Active Tracks</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Cohorts</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.cohorts || 0}</p>
          <span className="text-[10px] text-cyan-400 mt-1 block">Configured</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Mentors</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.mentors || 0}</p>
          <span className="text-[10px] text-violet-400 mt-1 block">Onboarded</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Mentees</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.mentees || 0}</p>
          <span className="text-[10px] text-emerald-400 mt-1 block">Enrolled</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Resources</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.publishedResources || 0}</p>
          <span className="text-[10px] text-amber-400 mt-1 block">Published</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Active (7d)</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.activeMenteesLast7Days || 0}</p>
          <span className="text-[10px] text-rose-400 mt-1 block">Participating</span>
        </div>
      </div>

      {/* Attention Required Panel */}
      {attention.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-400" />
            <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Attention Required ({attention.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attention.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-surface-200/90 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{item.cohort}</p>
                  <p className="text-[11px] text-amber-400/90 mt-0.5">{item.issue}</p>
                  {item.program && <span className="text-[10px] text-slate-500 font-mono">{item.program}</span>}
                </div>
                <Link
                  href="/admin/mentors"
                  className="px-2.5 py-1 rounded-lg bg-surface-300 hover:bg-surface-100 text-[11px] text-slate-300 transition-colors"
                >
                  Allocate →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-base p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Recent Activity</h3>
            <span className="text-[11px] text-slate-500 font-mono">Live Stream</span>
          </div>

          <div className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-xs text-slate-400">No activity logged yet.</p>
            ) : (
              recent.map((a) => (
                <div key={a.id} className="flex items-start justify-between p-3 rounded-xl bg-surface-300/40 border border-white/5 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-slate-200">
                      <span className="font-semibold text-white">{a.actor}</span> — {a.label || a.kind}
                    </p>
                    {a.resource && <p className="text-[11px] text-indigo-400">{a.resource}</p>}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(a.at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Nav Card */}
        <div className="card-base p-6 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-3 border-b border-white/5">
            Administration Tools
          </h3>
          <div className="space-y-2">
            <Link
              href="/admin/programs"
              className="flex items-center justify-between p-3 rounded-xl bg-surface-300/50 hover:bg-surface-100 border border-white/5 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers size={16} className="text-indigo-400" />
                <span className="text-slate-200 font-medium">Programs & Cohorts</span>
              </div>
              <ArrowRight size={14} className="text-slate-500" />
            </Link>

            <Link
              href="/admin/mentors"
              className="flex items-center justify-between p-3 rounded-xl bg-surface-300/50 hover:bg-surface-100 border border-white/5 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap size={16} className="text-violet-400" />
                <span className="text-slate-200 font-medium">Mentors & Allocation</span>
              </div>
              <ArrowRight size={14} className="text-slate-500" />
            </Link>

            <Link
              href="/admin/mentees"
              className="flex items-center justify-between p-3 rounded-xl bg-surface-300/50 hover:bg-surface-100 border border-white/5 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-emerald-400" />
                <span className="text-slate-200 font-medium">Mentee Directory</span>
              </div>
              <ArrowRight size={14} className="text-slate-500" />
            </Link>

            <Link
              href="/admin/analytics"
              className="flex items-center justify-between p-3 rounded-xl bg-surface-300/50 hover:bg-surface-100 border border-white/5 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 size={16} className="text-cyan-400" />
                <span className="text-slate-200 font-medium">Cohort Analytics</span>
              </div>
              <ArrowRight size={14} className="text-slate-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
