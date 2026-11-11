'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { GraduationCap, Plus, Copy, Check, RefreshCw, Layers } from '@/components/Icons';

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Onboard Mentor Modal
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');

  // Generated Credentials Modal
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Allocate Mentor Modal
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [activeMentor, setActiveMentor] = useState(null);
  const [selectedCohortId, setSelectedCohortId] = useState('');

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([api.getAdminMentors(), api.getAdminCohorts()]);
      setMentors(mRes.mentors || []);
      setCohorts(cRes.cohorts || []);
      if (cRes.cohorts?.length > 0 && !selectedCohortId) {
        setSelectedCohortId(cRes.cohorts[0]._id);
      }
    } catch (e) {
      toast('Failed to load mentors data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOnboardMentor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMentor({ name: mentorName, email: mentorEmail });
      toast('Mentor onboarded successfully!');
      setShowOnboardModal(false);
      setCreatedCredentials({
        name: res.mentor?.name || mentorName,
        email: res.mentor?.email || mentorEmail,
        password: res.initialPassword,
      });
      setMentorName('');
      setMentorEmail('');
      fetchData();
    } catch (err) {
      toast(err.message || 'Error onboarding mentor', 'error');
    }
  };

  const handleResetPassword = async (mentorId, mentorName, mentorEmail) => {
    try {
      const res = await api.resetMentorCredentials(mentorId);
      setCreatedCredentials({
        name: mentorName,
        email: mentorEmail,
        password: res.newPassword,
      });
      toast('Mentor password reset successfully!');
    } catch (err) {
      toast(err.message || 'Error resetting password', 'error');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!activeMentor || !selectedCohortId) return;
    try {
      await api.allocateMentor(selectedCohortId, activeMentor._id);
      toast('Mentor assigned to cohort successfully!');
      setShowAllocateModal(false);
      fetchData();
    } catch (err) {
      toast(err.message || 'Error allocating mentor', 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading mentors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <GraduationCap size={16} className="text-violet-400" /> Mentor Management ({mentors.length})
          </h2>
          <p className="text-xs text-slate-400">Onboard mentors, generate credentials, and assign them to cohorts.</p>
        </div>
        <button
          onClick={() => setShowOnboardModal(true)}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus size={14} /> Onboard New Mentor
        </button>
      </div>

      <div className="table-container bg-surface-200">
        <table className="table-base">
          <thead>
            <tr>
              <th>Mentor</th>
              <th>Email</th>
              <th>Assigned Cohorts</th>
              <th>Mentees</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mentors.map((m) => (
              <tr key={m._id}>
                <td className="font-semibold text-white">{m.name}</td>
                <td className="text-slate-300 font-mono text-xs">{m.email}</td>
                <td>
                  {m.cohorts?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {m.cohorts.map((c) => (
                        <span key={c._id || c} className="text-[10px] px-2 py-0.5 rounded bg-surface-300 text-slate-300 border border-white/5">
                          {c.name || c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs">Unassigned</span>
                  )}
                </td>
                <td className="text-slate-300">{m.menteeCount || 0}</td>
                <td>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${m.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                    {m.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveMentor(m);
                        setShowAllocateModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-300 hover:bg-surface-100 text-[11px] text-indigo-400 transition-colors flex items-center gap-1"
                    >
                      <Layers size={12} /> Assign Cohort
                    </button>
                    <button
                      onClick={() => handleResetPassword(m._id, m.name, m.email)}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                      title="Reset Password"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onboard Mentor Modal */}
      <Modal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} title="Onboard New Mentor">
        <form onSubmit={handleOnboardMentor} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              placeholder="e.g. Dr. Priya Sharma"
              required
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={mentorEmail}
              onChange={(e) => setMentorEmail(e.target.value)}
              placeholder="e.g. mentor.priya@techneeds.local"
              required
              className="input-base text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              A secure initial password will be automatically generated.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowOnboardModal(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Generate Credentials
            </button>
          </div>
        </form>
      </Modal>

      {/* Credentials Display Modal */}
      <Modal isOpen={Boolean(createdCredentials)} onClose={() => setCreatedCredentials(null)} title="Mentor Credentials Generated">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-300 border border-white/5 space-y-2">
            <p className="text-xs text-slate-400">Please record these credentials now. The password is only shown once:</p>
            <div className="text-xs space-y-1 font-mono pt-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-medium">{createdCredentials?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-medium">{createdCredentials?.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Password:</span>
                <span className="text-indigo-400 font-bold tracking-wider">{createdCredentials?.password}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => copyToClipboard(`Email: ${createdCredentials?.email}\nPassword: ${createdCredentials?.password}`)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
            </button>
            <button onClick={() => setCreatedCredentials(null)} className="btn-primary text-xs">
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Allocate Mentor Modal */}
      <Modal isOpen={showAllocateModal} onClose={() => setShowAllocateModal(false)} title={`Assign ${activeMentor?.name || 'Mentor'} to Cohort`}>
        <form onSubmit={handleAllocate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Cohort</label>
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="input-base text-xs"
            >
              {cohorts.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.program?.name || 'Program'})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAllocateModal(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Assign to Cohort
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
