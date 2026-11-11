'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';
import SkillConstellation from '@/components/SkillConstellation';
import BadgeCard from '@/components/BadgeCard';
import { 
  Sparkles, 
  Share2, 
  Edit, 
  Check, 
  Copy, 
  Target, 
  Flame, 
  Clock, 
  BookOpen, 
  Trophy,
  ArrowRight,
  ExternalLink
} from '@/components/Icons';

export default function MyNxtPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Avatar Customizer Modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState('orbit');
  const [avatarAccent, setAvatarAccent] = useState('#6366F1');

  // Share Profile Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareId, setShareId] = useState(null);
  const [copied, setCopied] = useState(false);

  // AI Narrative State
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const data = await api.getMyProfile();
      setProfile(data);
      if (data.user?.avatar) {
        setAvatarStyle(data.user.avatar.style || 'orbit');
        setAvatarAccent(data.user.avatar.accent || '#6366F1');
      }
      if (data.share) {
        setShareEnabled(Boolean(data.share.enabled));
        setShareId(data.share.id || null);
      }
    } catch (e) {
      toast('Failed to load MY NXT profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        avatar: { style: avatarStyle, accent: avatarAccent }
      });
      toast('Avatar customized successfully!');
      setShowAvatarModal(false);
      fetchProfile();
    } catch (err) {
      toast(err.message || 'Error updating avatar', 'error');
    }
  };

  const handleToggleShare = async () => {
    try {
      const res = await api.toggleProfileShare(!shareEnabled);
      setShareEnabled(res.enabled);
      setShareId(res.id);
      toast(res.enabled ? 'Public share link enabled!' : 'Public profile sharing disabled');
    } catch (err) {
      toast(err.message || 'Error toggling share', 'error');
    }
  };

  const handleGenerateAiNarrative = async () => {
    setNarrativeLoading(true);
    try {
      const res = await api.requestAiNarrative();
      setProfile((prev) => ({ ...prev, narrative: res }));
      toast('AI performance narrative updated!');
    } catch (err) {
      toast(err.message || 'AI generation unavailable', 'info');
    } finally {
      setNarrativeLoading(false);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Synthesizing your technical identity...</div>;
  }

  const user = profile?.user || {};
  const archetype = profile?.archetype || {};
  const skills = profile?.skills || [];
  const badges = profile?.badges || [];
  const timeline = profile?.timeline || [];
  const insights = profile?.insights || {};
  const recommendations = profile?.recommendations || [];
  const stats = profile?.stats || {};
  const narrative = profile?.narrative;

  return (
    <div className="space-y-6">
      {/* Signature Profile Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-surface-200 via-surface-200 to-indigo-950/40 border border-indigo-500/20 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-radial-glow pointer-events-none opacity-50" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar avatar={user.avatar} name={user.name} size={72} />
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-surface-100 border border-white/10 text-slate-300 hover:text-white shadow-sm"
                title="Customize Avatar"
              >
                <Edit size={12} />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {archetype.title || 'The Consistent Builder'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user.cohort?.name} • <span className="font-mono">{user.cohort?.program}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Share2 size={14} />
              <span>Share Profile</span>
            </button>
          </div>
        </div>

        {/* Archetype Description & Signals */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/5 space-y-2">
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            {archetype.description}
          </p>
          {archetype.reasons?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {archetype.reasons.map((r, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-surface-300 text-indigo-300 border border-white/5 font-mono">
                  • {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Skill Constellation & Activity Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Skill Constellation / Radar */}
        <div className="card-base p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" /> Skill Constellation
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real Activity Derived</span>
          </div>

          <div className="py-2">
            <SkillConstellation skills={skills} />
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-white/5">
            Proficiency calculated honestly from quiz accuracies, project evaluations, and mentor scores.
          </p>
        </div>

        {/* Insights & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Narrative (if available or deterministic) */}
          <div className="card-base p-6 space-y-3 border-indigo-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-violet-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Technical Performance Summary
                </h3>
              </div>
              <button
                onClick={handleGenerateAiNarrative}
                disabled={narrativeLoading}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                {narrativeLoading ? 'Analyzing...' : 'Refresh AI Summary'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {narrative?.text || profile?.summary || 'Consistent learner demonstrating strong progress across assigned cohort deliverables.'}
            </p>
          </div>

          {/* Performance Strengths & Learning Patterns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-base p-5 space-y-2">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Key Strengths
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(insights.strengths || ['Consistent on-time deliverable submission', 'Strong foundational web concepts']).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-base p-5 space-y-2">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                Areas for Growth
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(insights.improvements || ['Explore advanced algorithmic optimization', 'Increase documentation depth in projects']).map((imp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0">→</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Next Recommendations */}
          <div className="card-base p-6 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5">
              Personalized Recommendations
            </h3>
            <div className="space-y-2.5">
              {recommendations.length === 0 ? (
                <p className="text-xs text-slate-400">All current cohort deliverables completed!</p>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-300/40 border border-white/5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white">{rec.title}</p>
                      <p className="text-[11px] text-slate-400">{rec.reason}</p>
                    </div>
                    {rec.id && (
                      <a href={`/mentee/resources/${rec.id}`} className="btn-secondary text-[11px] py-1 px-2.5">
                        Start
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Badges Shelf */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" /> Milestone Badges Catalog ({badges.filter(b => b.earned).length}/{badges.length})
          </h3>
          <span className="text-xs text-slate-400">Unlocked only through verified milestone achievements</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {badges.map((b, i) => (
            <BadgeCard key={i} badge={b} />
          ))}
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="card-base p-6 space-y-4">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/5">
          Growth & Learning Timeline
        </h3>
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400">Timeline begins as you complete cohort activities.</p>
          ) : (
            timeline.map((evt, idx) => (
              <div key={idx} className="relative space-y-0.5">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-background" />
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">{evt.label || evt.title}</p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(evt.at || evt.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {evt.detail && <p className="text-[11px] text-slate-400">{evt.detail}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Avatar Customizer Modal */}
      <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} title="Personalize Your Avatar">
        <form onSubmit={handleUpdateAvatar} className="space-y-4">
          <div className="flex justify-center py-4">
            <Avatar avatar={{ style: avatarStyle, accent: avatarAccent }} name={user.name} size={80} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Visual Style</label>
            <div className="grid grid-cols-5 gap-2">
              {['orbit', 'prism', 'pixel', 'wave', 'grid'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAvatarStyle(s)}
                  className={`p-2 rounded-lg border text-xs capitalize transition-all ${
                    avatarStyle === s
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-surface-300 border-white/5 text-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Accent Color</label>
            <div className="flex gap-2">
              {['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarAccent(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: avatarAccent === c ? '#FFFFFF' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAvatarModal(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Avatar
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Profile Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Your Technical Journey">
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Generate a secure public profile showcase link. Private account details like email and enrollment numbers are automatically withheld.
          </p>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-300 border border-white/5">
            <div>
              <p className="text-xs font-semibold text-white">Public Showcase</p>
              <p className="text-[11px] text-slate-400">Allow anyone with the link to view your verified skills</p>
            </div>
            <button
              onClick={handleToggleShare}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                shareEnabled ? 'bg-emerald-600 text-white' : 'bg-surface-100 text-slate-400'
              }`}
            >
              {shareEnabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          {shareEnabled && shareId && (
            <div className="p-3 rounded-xl bg-surface-300/80 border border-white/5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Public URL</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${shareId}`}
                  className="input-base text-xs font-mono py-1.5"
                />
                <button
                  onClick={copyShareLink}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={() => setShowShareModal(false)} className="btn-primary text-xs">
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
