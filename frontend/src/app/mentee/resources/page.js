'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { BookOpen, Video, HelpCircle, Code, Clock, CheckCircle2, AlertCircle, ArrowRight } from '@/components/Icons';

export default function MenteeResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      const q = new URLSearchParams();
      if (typeFilter !== 'all') q.append('type', typeFilter);
      if (statusFilter !== 'all') q.append('status', statusFilter);
      const res = await api.getMenteeResources(q.toString());
      setResources(res.resources || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading learning hub...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-white/5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-400" /> Learning Deliverables & Modules
        </h2>
        <p className="text-xs text-slate-400">Complete assigned videos, interactive quizzes, and projects before deadlines.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-200 border border-white/5">
        <div className="flex items-center gap-1">
          {['all', 'video', 'quiz', 'project'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                typeFilter === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'All' : `${t}s`}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base text-xs py-1.5 w-44"
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
          <option value="evaluated">Evaluated</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Deliverables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((r) => {
          const isOverdue = r.status === 'overdue';
          const isDone = r.status === 'evaluated' || r.status === 'completed';
          return (
            <div key={r._id} className="card-base p-5 card-hover flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    r.type === 'video' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    r.type === 'quiz' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {r.type === 'video' ? <Video size={11} /> : r.type === 'quiz' ? <HelpCircle size={11} /> : <Code size={11} />}
                    {r.type}
                  </span>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                    isDone ? 'bg-emerald-500/10 text-emerald-400' :
                    r.status === 'submitted' ? 'bg-indigo-500/10 text-indigo-400' :
                    isOverdue ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    r.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white">{r.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {r.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Due: {new Date(r.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-semibold text-slate-300">
                    {r.maxMarks > 0 ? `${r.maxMarks} pts` : 'Complete'}
                  </span>
                </div>

                <Link
                  href={`/mentee/resources/${r._id}`}
                  className="btn-primary w-full text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>{isDone ? 'View Results & Review' : r.status === 'submitted' ? 'View Submission' : 'Open Deliverable'}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
