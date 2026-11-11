'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Video, 
  HelpCircle, 
  Code, 
  AlertCircle,
  ExternalLink 
} from '@/components/Icons';

export default function MenteeDeliverablePlayerPage() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Project state
  const [repoLink, setRepoLink] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);

  const { toast } = useToast();

  const fetchResource = async () => {
    try {
      const res = await api.getMenteeResource(id);
      setResource(res.resource || res);
      if (res.resource?.type === 'quiz' && (res.resource.status === 'evaluated' || res.resource.status === 'submitted')) {
        api.getQuizResult(id).then(setQuizResult).catch(() => {});
      }
      if (res.resource?.submission) {
        setRepoLink(res.resource.submission.link || '');
        setProjectNotes(res.resource.submission.notes || '');
      }
    } catch (e) {
      toast('Failed to load deliverable', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchResource();
  }, [id]);

  const handleStartVideo = async () => {
    try {
      await api.startVideo(id);
      toast('Video session marked as in-progress!');
      fetchResource();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleCompleteVideo = async () => {
    try {
      await api.completeVideo(id);
      toast('Congratulations! Video module completed.');
      fetchResource();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleQuizAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    const formatted = Object.entries(answers).map(([qId, optIdx]) => ({
      questionId: qId,
      selectedIndex: optIdx,
    }));

    if (formatted.length < (resource.questions || []).length) {
      toast('Please answer all questions before submitting', 'error');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const res = await api.submitQuiz(id, formatted);
      setQuizResult(res);
      toast(`Quiz completed! You scored ${res.score} / ${res.maxScore}`);
      fetchResource();
    } catch (e) {
      toast(e.message || 'Error submitting quiz', 'error');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setSubmittingProject(true);
    try {
      await api.submitProject(id, { link: repoLink, notes: projectNotes });
      toast('Project submitted for mentor evaluation!');
      fetchResource();
    } catch (e) {
      toast(e.message || 'Error submitting project', 'error');
    } finally {
      setSubmittingProject(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading deliverable interface...</div>;
  }

  if (!resource) {
    return <div className="text-rose-400 text-xs py-8">Resource deliverable not found.</div>;
  }

  const isVideo = resource.type === 'video';
  const isQuiz = resource.type === 'quiz';
  const isProject = resource.type === 'project';
  const isCompleted = resource.status === 'completed' || resource.status === 'evaluated';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/mentee/resources" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
        ← Back to Learning Hub
      </Link>

      {/* Header Info Banner */}
      <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {resource.type} Module
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} /> Due: {new Date(resource.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white">{resource.title}</h2>
        <p className="text-xs text-slate-300 leading-relaxed">{resource.description}</p>

        {resource.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {resource.skills.map((s, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-surface-300 text-slate-400 border border-white/5">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 1. Video Player Engine */}
      {isVideo && (
        <div className="card-base p-6 space-y-6">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
            {resource.videoUrl?.includes('youtube.com') || resource.videoUrl?.includes('youtu.be') ? (
              <iframe
                src={resource.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title={resource.title}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <Video size={40} className="text-indigo-400 mx-auto" />
                <p className="text-xs text-slate-300">Direct Video Stream URL</p>
                <a
                  href={resource.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                >
                  <span>Open Video in New Tab</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {resource.instructions && (
            <div className="p-4 rounded-xl bg-surface-300/50 border border-white/5 space-y-1.5">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Instructions</span>
              <p className="text-xs text-slate-400 leading-relaxed">{resource.instructions}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Duration: {resource.durationMinutes || 20} minutes
            </span>
            <div className="flex items-center gap-2">
              {resource.status !== 'in_progress' && !isCompleted && (
                <button onClick={handleStartVideo} className="btn-secondary text-xs">
                  Start Learning
                </button>
              )}
              {!isCompleted ? (
                <button onClick={handleCompleteVideo} className="btn-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Mark as Completed
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Completed
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Quiz Engine */}
      {isQuiz && (
        <div className="space-y-6">
          {/* If already submitted / evaluated, show detailed breakdown */}
          {quizResult ? (
            <div className="card-base p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Assessment Evaluation Complete
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Your Score: {quizResult.score} / {quizResult.maxScore} ({quizResult.pct}%)
                  </h3>
                </div>
                {quizResult.late && (
                  <span className="text-xs text-rose-400 font-mono px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                    Late Submission
                  </span>
                )}
              </div>

              {/* Questions Breakdown */}
              <div className="space-y-4">
                {(quizResult.breakdown || []).map((b, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${b.correct ? 'bg-emerald-950/15 border-emerald-500/20' : 'bg-rose-950/15 border-rose-500/20'} space-y-2`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white">Q{idx + 1}: {b.text}</p>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${b.correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {b.correct ? `+${b.marks} pts` : '0 pts'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {b.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                            optIdx === b.correctIndex
                              ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                              : optIdx === b.selectedIndex
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-surface-300/40 text-slate-400'
                          }`}
                        >
                          <span>{opt}</span>
                          {optIdx === b.correctIndex && <span className="text-[10px] text-emerald-400">Correct Answer</span>}
                          {optIdx === b.selectedIndex && optIdx !== b.correctIndex && <span className="text-[10px] text-rose-400">Your Selection</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz Active Form */
            <form onSubmit={handleSubmitQuiz} className="card-base p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  {(resource.questions || []).length} Multiple Choice Questions
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Time Limit: {resource.timeLimitMinutes || 15} mins
                </span>
              </div>

              <div className="space-y-6">
                {(resource.questions || []).map((q, idx) => (
                  <div key={q._id || idx} className="p-4 rounded-xl bg-surface-300/50 border border-white/5 space-y-3">
                    <p className="text-xs font-semibold text-white">
                      Question {idx + 1}: {q.text} ({q.marks} pts)
                    </p>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            answers[q._id] === optIdx
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-surface-200 border-white/5 text-slate-300 hover:border-white/10'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`quiz_q_${q._id}`}
                            checked={answers[q._id] === optIdx}
                            onChange={() => handleQuizAnswer(q._id, optIdx)}
                            className="accent-indigo-500"
                          />
                          <span className="text-xs">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingQuiz}
                  className="btn-primary text-xs py-2.5 px-6 rounded-xl shadow-glow-primary"
                >
                  {submittingQuiz ? 'Evaluating Answers...' : 'Submit Quiz Answers'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. Hands-on Project Submission Engine */}
      {isProject && (
        <div className="card-base p-6 space-y-6">
          {resource.instructions && (
            <div className="p-4 rounded-xl bg-surface-300/50 border border-white/5 space-y-1.5">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Project Guidelines</span>
              <p className="text-xs text-slate-300 leading-relaxed">{resource.instructions}</p>
            </div>
          )}

          {resource.submissionFormat && (
            <div className="p-3.5 rounded-xl bg-surface-300/30 border border-white/5 text-xs text-slate-400">
              <strong className="text-white">Format:</strong> {resource.submissionFormat}
            </div>
          )}

          {/* If already evaluated */}
          {resource.submission?.status === 'evaluated' && (
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Mentor Evaluation Completed
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {resource.submission.marks} / {resource.maxMarks} Marks Awarded
                </span>
              </div>
              <p className="text-xs text-slate-200 italic pt-1 border-t border-white/5">
                "{resource.submission.feedback}"
              </p>
            </div>
          )}

          {/* Submission Form */}
          <form onSubmit={handleSubmitProject} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Deliverable URL (GitHub Repository or Live Demo)
              </label>
              <input
                type="url"
                value={repoLink}
                onChange={(e) => setRepoLink(e.target.value)}
                placeholder="https://github.com/your-username/project-repo"
                required
                disabled={resource.submission?.status === 'evaluated'}
                className="input-base text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Submission Notes & Architectural Highlights
              </label>
              <textarea
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                placeholder="Briefly describe what you built, architecture choices, and instructions for running..."
                rows={4}
                disabled={resource.submission?.status === 'evaluated'}
                className="input-base text-xs"
              />
            </div>

            {resource.submission?.status !== 'evaluated' && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingProject}
                  className="btn-primary text-xs py-2.5 px-6 rounded-xl shadow-glow-primary"
                >
                  {submittingProject ? 'Uploading...' : resource.submission ? 'Update Submission' : 'Submit Project'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
