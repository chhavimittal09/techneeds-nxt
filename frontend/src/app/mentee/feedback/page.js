'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FileText, CheckCircle2, Clock } from '@/components/Icons';

export default function MenteeFeedbackPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMenteeFeedback()
      .then((res) => setItems(res.items || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading mentor feedback history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-white/5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText size={16} className="text-indigo-400" /> Mentor Feedback Archive
        </h2>
        <p className="text-xs text-slate-400">All constructive feedback, marks, and revision history awarded by your mentors.</p>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="card-base p-8 text-center text-xs text-slate-400">
            No mentor evaluations recorded yet. Complete project deliverables to receive evaluation comments.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card-base p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">{item.resource}</h3>
                <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {item.marks} / {item.maxMarks} Marks Awarded
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-300 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  Mentor Evaluation Note:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{item.feedback}</p>
              </div>

              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock size={11} /> Evaluated on {new Date(item.evaluatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
