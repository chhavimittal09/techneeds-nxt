'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Users, Search, Filter } from '@/components/Icons';

export default function AdminMenteesPage() {
  const [mentees, setMentees] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.append('q', search);
      if (selectedCohort) q.append('cohort', selectedCohort);
      const res = await api.getAdminMentees(q.toString());
      setMentees(res.mentees || []);
      setCohorts(res.cohorts || []);
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

  const handleToggleStatus = async (menteeId, currentStatus) => {
    try {
      await api.updateMenteeStatus(menteeId, !currentStatus);
      toast(`Mentee status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchData();
    } catch (err) {
      toast(err.message || 'Error updating status', 'error');
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading mentee directory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-emerald-400" /> Mentee Directory ({mentees.length})
          </h2>
          <p className="text-xs text-slate-400">All registered students across programs and cohorts.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name / enrollment..."
              className="input-base text-xs pr-8 py-1.5 w-60"
            />
            <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
            </button>
          </form>

          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="input-base text-xs py-1.5 w-44"
          >
            <option value="">All Cohorts</option>
            {cohorts.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container bg-surface-200">
        <table className="table-base">
          <thead>
            <tr>
              <th>Enrollment No.</th>
              <th>Mentee Name</th>
              <th>Cohort</th>
              <th>Score</th>
              <th>Status</th>
              <th>Enrolled Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mentees.map((m) => (
              <tr key={m._id}>
                <td className="font-mono text-xs text-indigo-400 font-semibold">{m.enrollmentNumber}</td>
                <td className="font-medium text-white">{m.name}</td>
                <td className="text-slate-300">{m.cohort?.name || 'Unassigned'}</td>
                <td className="font-semibold text-slate-200">{m.score !== undefined ? `${Math.round(m.score)} pts` : '—'}</td>
                <td>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${m.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                    {m.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(m._id, m.active)}
                    className="text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    {m.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
