'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { 
  BookOpen, 
  Video, 
  Code, 
  HelpCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Trash2
} from '@/components/Icons';

export default function MentorResourcesPage() {
  const [resources, setResources] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Create Resource Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resType, setResType] = useState('video'); // 'video' | 'quiz' | 'project'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [skills, setSkills] = useState('Web Development');
  const [deadline, setDeadline] = useState('');
  const [targetCohort, setTargetCohort] = useState('');

  // Video specific
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('20');
  const [videoMaxMarks, setVideoMaxMarks] = useState('0');

  // Project specific
  const [submissionFormat, setSubmissionFormat] = useState('GitHub repository URL and live demo link');
  const [projectMaxMarks, setProjectMaxMarks] = useState('100');

  // Quiz specific question builder
  const [quizMaxMarks, setQuizMaxMarks] = useState('10');
  const [timeLimit, setTimeLimit] = useState('15');
  const [questions, setQuestions] = useState([
    {
      text: 'Which keyword declares a block-scoped variable in modern JavaScript?',
      options: ['var', 'let', 'dim', 'define'],
      correctIndex: 1,
      marks: 2,
    },
    {
      text: 'What does Array.prototype.map return?',
      options: ['A new array', 'The original array', 'The array length', 'undefined'],
      correctIndex: 0,
      marks: 2,
    }
  ]);

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [rRes, cRes] = await Promise.all([api.getMentorResources(), api.getMentorCohorts()]);
      setResources(rRes.resources || []);
      setCohorts(cRes.cohorts || []);
      if (cRes.cohorts?.length > 0 && !targetCohort) {
        setTargetCohort(cRes.cohorts[0]._id);
      }
    } catch (e) {
      toast('Failed to load resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', options: ['', '', '', ''], correctIndex: 0, marks: 2 }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, val) => {
    const updated = [...questions];
    updated[idx][field] = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = {
        type: resType,
        cohort: targetCohort,
        title,
        description,
        instructions,
        skills: skillList,
        deadline: new Date(deadline).toISOString(),
        published: true,
      };

      if (resType === 'video') {
        payload.videoUrl = videoUrl;
        payload.durationMinutes = Number(duration) || 20;
        payload.maxMarks = Number(videoMaxMarks) || 0;
      } else if (resType === 'quiz') {
        payload.timeLimitMinutes = Number(timeLimit) || 15;
        payload.questions = questions.map((q) => ({
          text: q.text,
          options: q.options.filter(Boolean),
          correctIndex: Number(q.correctIndex),
          marks: Number(q.marks) || 1,
        }));
      } else if (resType === 'project') {
        payload.submissionFormat = submissionFormat;
        payload.maxMarks = Number(projectMaxMarks) || 100;
      }

      await api.createResource(payload);
      toast('Resource published successfully!');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setInstructions('');
      fetchData();
    } catch (err) {
      toast(err.message || 'Error creating resource', 'error');
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.publishResource(id);
      toast('Resource published to cohort!');
      fetchData();
    } catch (err) {
      toast(err.message || 'Error publishing resource', 'error');
    }
  };

  const filteredResources = filterType === 'all' 
    ? resources 
    : resources.filter((r) => r.type === filterType);

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading resource studio...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" /> Resource Creation Studio
          </h2>
          <p className="text-xs text-slate-400">Design videos, quizzes, and project deliverables for your cohorts.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus size={14} /> Create Resource
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex p-1 rounded-xl bg-surface-200 border border-white/5 w-fit">
        {['all', 'video', 'quiz', 'project'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
              filterType === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'all' ? 'All Deliverables' : `${t}s`}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((r) => (
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

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  r.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {r.published ? 'Published' : 'Draft'}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white">{r.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {r.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Due: {new Date(r.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
                <span className="font-semibold text-slate-300">
                  {r.maxMarks > 0 ? `${r.maxMarks} max pts` : 'Completion'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link
                  href={`/mentor/resources/${r._id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  Submissions & Grading →
                </Link>

                {!r.published && (
                  <button
                    onClick={() => handlePublish(r._id)}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Resource Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Mentorship Deliverable" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateResource} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Resource Category</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'video', label: 'Video Module', icon: Video },
                { type: 'quiz', label: 'Interactive Quiz', icon: HelpCircle },
                { type: 'project', label: 'Hands-on Project', icon: Code },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setResType(t.type)}
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      resType === t.type
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                        : 'bg-surface-300 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={16} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Cohort</label>
              <select
                value={targetCohort}
                onChange={(e) => setTargetCohort(e.target.value)}
                className="input-base text-xs"
              >
                {cohorts.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Deadline Date & Time</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="input-base text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Asynchronous JavaScript & Promises"
              required
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description & Overview</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of concepts covered..."
              rows={2}
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Skills (Comma-separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Web Development, Programming"
              className="input-base text-xs"
            />
          </div>

          {/* Conditional Fields based on Type */}
          {resType === 'video' && (
            <div className="p-4 rounded-xl bg-surface-300/60 border border-white/5 space-y-3">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">Video Details</span>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Video URL (YouTube or Direct)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  className="input-base text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="input-base text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Marks (Optional)</label>
                  <input
                    type="number"
                    value={videoMaxMarks}
                    onChange={(e) => setVideoMaxMarks(e.target.value)}
                    className="input-base text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {resType === 'quiz' && (
            <div className="p-4 rounded-xl bg-surface-300/60 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Quiz Questions Builder</span>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Question
                </button>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-3.5 rounded-lg bg-surface-200 border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Question {qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => handleRemoveQuestion(qIdx)} className="text-rose-400 hover:text-rose-300">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(qIdx, 'text', e.target.value)}
                      placeholder="Question prompt..."
                      required
                      className="input-base text-xs"
                    />

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] text-slate-400">Options (Select radio for correct answer):</span>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => handleQuestionChange(qIdx, 'correctIndex', optIdx)}
                            className="accent-indigo-500"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            required
                            className="input-base text-xs py-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resType === 'project' && (
            <div className="p-4 rounded-xl bg-surface-300/60 border border-white/5 space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Project Criteria</span>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expected Submission Format</label>
                <input
                  type="text"
                  value={submissionFormat}
                  onChange={(e) => setSubmissionFormat(e.target.value)}
                  placeholder="e.g. GitHub Repository link with README and live demo"
                  required
                  className="input-base text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Maximum Evaluated Marks</label>
                <input
                  type="number"
                  value={projectMaxMarks}
                  onChange={(e) => setProjectMaxMarks(e.target.value)}
                  min="1"
                  max="1000"
                  required
                  className="input-base text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Create & Publish Deliverable
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
