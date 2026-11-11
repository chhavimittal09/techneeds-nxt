'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, ExternalLink, HelpCircle, Code, Video } from '@/components/Icons';

export default function MentorEvaluationDeskPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Evaluate Modal
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const res = await api.getResourceSubmissions(id);
      setData(res);
    } catch (e) {
      toast('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleOpenEvaluate = (sub) => {
    setActiveSubmission(sub);
    setMarks(sub.marks !== null && sub.marks !== undefined ? String(sub.marks) : '');
    setFeedback(sub.feedback || '');
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    if (!activeSubmission) return;
    try {
      await api.evaluateSubmission(activeSubmission._id, {
        marks: Number(marks),
        feedback,
      });
      toast('Submission evaluated and scores updated!');
      setActiveSubmission(null);
      fetchData();
    } catch (err) {
      toast(err.message || 'Error evaluating submission', 'error');
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading submissions and evaluations...</div>;
  }

  const resource = data?.resource || {};
  const submissions = data?.submissions || [];
  const questionStats = data?.questionStats || [];

  return (
    <div className="space-y-6">
      <Link href="/mentor/resources" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
        ← Back to Resource Studio
      </Link>

      {/* Resource Overview Card */}
      <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {resource.type}
          </span>
          <span className="text-xs text-slate-400">
            Max Marks: {resource.maxMarks || 0} pts
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">{resource.title}</h2>
        <p className="text-xs text-slate-400 max-w-2xl">{resource.description}</p>
      </div>

      {/* For Quizzes: Accuracy Breakdown */}
      {resource.type === 'quiz' && questionStats.length > 0 && (
        <div className="card-base p-6 space-y-4">
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider pb-2 border-b border-white/5">
            Per-Question Accuracy Analysis ({questionStats.length} Questions)
          </h3>
          <div className="space-y-3">
            {questionStats.map((q, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-lg">
                    Q{idx + 1}: {q.text}
                  </span>
                  <span className="font-semibold text-cyan-400">{q.accuracyPct}% correct</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${q.accuracyPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Student Submissions ({submissions.length})
          </h3>
        </div>

        <div className="table-container bg-surface-300/40">
          <table className="table-base">
            <thead>
              <tr>
                <th>Mentee</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Score Awarded</th>
                <th>Work Deliverable</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                    No submissions recorded for this deliverable yet.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s._id}>
                    <td className="font-semibold text-white">{s.mentee?.name || 'Mentee'}</td>
                    <td className="text-xs text-slate-400">
                      {new Date(s.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {s.late && <span className="ml-1 text-[10px] text-rose-400 font-mono">(Late)</span>}
                    </td>
                    <td>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono capitalize ${
                        s.status === 'evaluated' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="font-bold text-slate-200">
                      {s.marks !== null && s.marks !== undefined ? `${s.marks} / ${resource.maxMarks}` : '—'}
                    </td>
                    <td className="text-xs">
                      {s.link ? (
                        <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                          View Deliverable <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-slate-500">Auto-Assessed Quiz</span>
                      )}
                      {s.notes && <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{s.notes}</p>}
                    </td>
                    <td>
                      {resource.type === 'project' && (
                        <button
                          onClick={() => handleOpenEvaluate(s)}
                          className="btn-primary text-[11px] py-1 px-3"
                        >
                          {s.status === 'evaluated' ? 'Re-Evaluate' : 'Grade & Feedback'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluate Modal */}
      <Modal isOpen={Boolean(activeSubmission)} onClose={() => setActiveSubmission(null)} title={`Evaluate: ${activeSubmission?.mentee?.name}`}>
        <form onSubmit={handleEvaluateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Marks Awarded (Max: {resource.maxMarks})
            </label>
            <input
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              min="0"
              max={resource.maxMarks || 100}
              required
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Constructive Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive actionable comments on architecture, design, and code cleanliness..."
              rows={4}
              required
              className="input-base text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActiveSubmission(null)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Publish Evaluation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
