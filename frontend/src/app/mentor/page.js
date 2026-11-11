'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  Users, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  FileText,
  BarChart3
} from '@/components/Icons';

export default function MentorDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMentorDashboard()
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading mentor dashboard...</div>;
  }

  const totals = data?.totals || {};
  const upcoming = data?.upcomingDeadlines || [];
  const inactive = data?.inactiveMentees || [];
  const recent = data?.recentSubmissions || [];
  const performance = data?.performance || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface-200 border border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white">Mentor Workspace</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track cohort progress, evaluate deliverables, and onboard mentees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/mentor/resources" className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={14} /> Create Resource
          </Link>
          <Link href="/mentor/mentees" className="btn-secondary text-xs flex items-center gap-1.5">
            <Plus size={14} /> Add Mentee
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Assigned Cohorts</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.cohorts || 0}</p>
          <span className="text-[10px] text-indigo-400 mt-1 block">Active</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Total Mentees</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.totalMentees || 0}</p>
          <span className="text-[10px] text-violet-400 mt-1 block">Enrolled students</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Active Assignments</span>
          <p className="text-2xl font-bold text-white mt-1">{totals.activeAssignments || 0}</p>
          <span className="text-[10px] text-cyan-400 mt-1 block">In progress</span>
        </div>
        <div className="card-base p-4">
          <span className="text-[11px] font-medium text-slate-400">Pending Evaluations</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totals.pendingEvaluations || 0}</p>
          <span className="text-[10px] text-amber-300 mt-1 block">Require grading</span>
        </div>
      </div>

      {/* Two Column Layout: Submissions Queue & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 card-base p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Pending & Recent Submissions
            </h3>
            <Link href="/mentor/resources" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-xs text-slate-400">No submissions yet.</p>
            ) : (
              recent.map((s) => (
                <div key={s._id} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-300/40 border border-white/5 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">{s.mentee?.name || 'Mentee'}</p>
                    <p className="text-[11px] text-slate-400">{s.resource?.title} (Max {s.resource?.maxMarks} pts)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${s.status === 'evaluated' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {s.status === 'evaluated' ? `Graded: ${s.marks} pts` : 'Needs Evaluation'}
                    </span>
                    <Link
                      href={`/mentor/resources/${s.resource?._id}`}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      Evaluate
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Alerts: Upcoming Deadlines & Inactive Learners */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="card-base p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-1.5">
              <Clock size={14} className="text-cyan-400" /> Upcoming Deadlines
            </h3>
            <div className="space-y-2">
              {upcoming.length === 0 ? (
                <p className="text-xs text-slate-400">No upcoming deadlines.</p>
              ) : (
                upcoming.map((u) => (
                  <div key={u.id} className="p-2.5 rounded-lg bg-surface-300/50 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white truncate">{u.title}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">{u.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Due: {new Date(u.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inactive Mentees */}
          {inactive.length > 0 && (
            <div className="card-base p-5 space-y-3 border-amber-500/20">
              <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-400" /> Inactive Learners ({inactive.length})
              </h3>
              <p className="text-[11px] text-slate-400">Learners with no activity in over 7 days:</p>
              <div className="space-y-1.5">
                {inactive.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-xs p-2 rounded bg-surface-300/40">
                    <span className="text-slate-300 font-medium">{m.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{m.enrollmentNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
