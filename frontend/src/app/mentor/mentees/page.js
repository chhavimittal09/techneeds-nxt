'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { Users, Plus, Copy, Check, Search, ArrowRight } from '@/components/Icons';

export default function MentorMenteesPage() {
  const [mentees, setMentees] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [search, setSearch] = useState('');

  // Add Mentee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [menteeName, setMenteeName] = useState('');
  const [targetCohortId, setTargetCohortId] = useState('');

  // Credentials Generated Modal
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        api.getMentorMentees(selectedCohort, search),
        api.getMentorCohorts()
      ]);
      setMentees(mRes.mentees || []);
      setCohorts(cRes.cohorts || []);
      if (cRes.cohorts?.length > 0 && !targetCohortId) {
        setTargetCohortId(cRes.cohorts[0]._id);
      }
    } catch (e) {
      toast('Failed to load mentees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCohort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleAddMentee = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMentee({
        name: menteeName,
        cohortId: targetCohortId,
      });
      toast('Mentee created with generated credentials!');
      setShowAddModal(false);
      setCredentials({
        name: res.mentee?.name || menteeName,
        enrollmentNumber: res.mentee?.enrollmentNumber,
        password: res.initialPassword,
      });
      setMenteeName('');
      fetchData();
    } catch (err) {
      toast(err.message || 'Error creating mentee', 'error');
    }
  };

  const copyCredentials = () => {
    const text = `Mentee Login Credentials\nName: ${credentials?.name}\nEnrollment No: ${credentials?.enrollmentNumber}\nInitial Password: ${credentials?.password}\nLogin URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading assigned mentees...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-violet-400" /> Mentee Management ({mentees.length})
          </h2>
          <p className="text-xs text-slate-400">Onboard mentees, issue auto-generated enrollment credentials, and review records.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Mentee to Cohort
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface-200 border border-white/5">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or enrollment..."
            className="input-base text-xs pr-8 py-1.5"
          />
          <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={14} />
          </button>
        </form>

        <select
          value={selectedCohort}
          onChange={(e) => setSelectedCohort(e.target.value)}
          className="input-base text-xs py-1.5 w-full sm:w-56"
        >
          <option value="">All Assigned Cohorts</option>
          {cohorts.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Mentees Table */}
      <div className="table-container bg-surface-200">
        <table className="table-base">
          <thead>
            <tr>
              <th>Enrollment No.</th>
              <th>Name</th>
              <th>Overall Score</th>
              <th>Assessment</th>
              <th>Completion</th>
              <th>Consistency</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mentees.map((m) => (
              <tr key={m.id || m._id}>
                <td className="font-mono text-xs text-indigo-400 font-semibold">{m.enrollmentNumber}</td>
                <td className="font-medium text-white">{m.name}</td>
                <td className="font-bold text-slate-200">{Math.round(m.score || 0)} pts</td>
                <td className="text-slate-300">{Math.round(m.assessment || 0)}%</td>
                <td className="text-slate-300">{Math.round(m.completion || 0)}%</td>
                <td className="text-slate-300">{Math.round(m.consistency || 0)}%</td>
                <td>
                  <Link
                    href={`/mentor/mentees/${m.id || m._id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    View Details <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Mentee Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Onboard Mentee">
        <form onSubmit={handleAddMentee} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Cohort</label>
            <select
              value={targetCohortId}
              onChange={(e) => setTargetCohortId(e.target.value)}
              className="input-base text-xs"
            >
              {cohorts.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Student Full Name</label>
            <input
              type="text"
              value={menteeName}
              onChange={(e) => setMenteeName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              required
              className="input-base text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              A unique enrollment number (e.g. TNX26####) and secure password will be generated automatically.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Create Mentee
            </button>
          </div>
        </form>
      </Modal>

      {/* Display Generated Credentials Modal */}
      <Modal isOpen={Boolean(credentials)} onClose={() => setCredentials(null)} title="Mentee Account Generated">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-300 border border-white/5 space-y-2">
            <p className="text-xs text-slate-400">Share these initial sign-in credentials with the student:</p>
            <div className="text-xs space-y-1 font-mono pt-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-medium">{credentials?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Enrollment No:</span>
                <span className="text-indigo-400 font-bold">{credentials?.enrollmentNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Initial Password:</span>
                <span className="text-emerald-400 font-bold tracking-wider">{credentials?.password}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={copyCredentials}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
            </button>
            <button onClick={() => setCredentials(null)} className="btn-primary text-xs">
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
