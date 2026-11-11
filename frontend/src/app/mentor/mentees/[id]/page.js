'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import BadgeCard from '@/components/BadgeCard';
import { ArrowRight, CheckCircle2, Clock, ExternalLink, BookOpen, Trophy } from '@/components/Icons';

export default function MenteeDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getMenteeDetail(id)
        .then(setData)
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading student records...</div>;
  }

  const mentee = data?.mentee || {};
  const metrics = data?.metrics || {};
  const records = data?.records || [];
  const badges = data?.badges || [];

  return (
    <div className="space-y-6">
      <Link href="/mentor/mentees" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
        ← Back to Mentees Roster
      </Link>

      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar avatar={mentee.avatar} name={mentee.name} size={56} />
          <div>
            <h2 className="text-lg font-bold text-white">{mentee.name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span className="text-indigo-400 font-semibold">{mentee.enrollmentNumber}</span>
              <span>•</span>
              <span>{mentee.cohort?.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-surface-300 p-3 rounded-xl border border-white/5">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase">Overall</span>
            <p className="text-lg font-bold text-white">{Math.round(metrics.score || 0)}</p>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase">Assessment</span>
            <p className="text-lg font-bold text-indigo-400">{Math.round(metrics.assessment || 0)}%</p>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase">Completion</span>
            <p className="text-lg font-bold text-cyan-400">{Math.round(metrics.completion || 0)}%</p>
          </div>
        </div>
      </div>

      {/* Activity & Performance Records */}
      <div className="card-base p-6 space-y-4">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5">
          Curriculum Progress & Submissions
        </h3>

        <div className="table-container bg-surface-300/40">
          <table className="table-base">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Status</th>
                <th>Marks</th>
                <th>Submission Details</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium text-white">{r.title}</td>
                  <td className="text-xs text-slate-400 font-mono capitalize">{r.type}</td>
                  <td>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono capitalize ${
                      r.status === 'evaluated' || r.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : r.status === 'submitted'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-200">
                    {r.marks !== null && r.marks !== undefined ? `${r.marks} / ${r.maxMarks}` : '—'}
                  </td>
                  <td className="text-xs text-slate-400">
                    {r.feedback && <p className="text-slate-300 italic">"{r.feedback}"</p>}
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 mt-0.5">
                        View Submission Link <ExternalLink size={10} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
