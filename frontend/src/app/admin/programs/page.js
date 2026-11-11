'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { Plus, Layers, Calendar, Users, Edit } from '@/components/Icons';

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);

  // New Program Form State
  const [progName, setProgName] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progTags, setProgTags] = useState('');

  // New Cohort Form State
  const [selectedProgId, setSelectedProgId] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState('40');

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([api.getAdminPrograms(), api.getAdminCohorts()]);
      setPrograms(pRes.programs || []);
      setCohorts(cRes.cohorts || []);
      if (pRes.programs?.length > 0 && !selectedProgId) {
        setSelectedProgId(pRes.programs[0]._id);
      }
    } catch (e) {
      toast('Failed to load programs and cohorts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    try {
      const tags = progTags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.createProgram({ name: progName, description: progDesc, tags });
      toast('Program created successfully!');
      setShowProgramModal(false);
      setProgName('');
      setProgDesc('');
      setProgTags('');
      fetchData();
    } catch (err) {
      toast(err.message || 'Error creating program', 'error');
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    try {
      await api.createCohort({
        program: selectedProgId,
        name: cohortName,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        capacity: Number(capacity) || 40,
      });
      toast('Cohort configured successfully!');
      setShowCohortModal(false);
      setCohortName('');
      setStartDate('');
      setEndDate('');
      fetchData();
    } catch (err) {
      toast(err.message || 'Error creating cohort', 'error');
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-8">Loading programs and cohorts...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Programs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" /> Mentorship Programs ({programs.length})
            </h2>
            <p className="text-xs text-slate-400">High-level tracks encompassing cohorts and specialized curricula.</p>
          </div>
          <button
            onClick={() => setShowProgramModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Program
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => (
            <div key={p._id} className="card-base p-5 card-hover flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {p.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(p.tags || []).map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-surface-300 text-slate-400 border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-500">
                  <span>{p.cohortCount || 0} Cohorts</span>
                  <span>{p.menteeCount || 0} Mentees</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cohorts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-cyan-400" /> Active Cohorts ({cohorts.length})
            </h2>
            <p className="text-xs text-slate-400">Time-bound groups of mentees and assigned mentors.</p>
          </div>
          <button
            onClick={() => setShowCohortModal(true)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> New Cohort
          </button>
        </div>

        <div className="table-container bg-surface-200">
          <table className="table-base">
            <thead>
              <tr>
                <th>Cohort Name</th>
                <th>Program</th>
                <th>Schedule</th>
                <th>Capacity</th>
                <th>Mentors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c._id}>
                  <td className="font-semibold text-white">{c.name}</td>
                  <td className="text-slate-300">{c.program?.name || 'Unassigned'}</td>
                  <td className="text-xs text-slate-400">
                    {new Date(c.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(c.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="text-slate-300">{c.capacity} Mentees</td>
                  <td>
                    {c.mentors?.length > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-indigo-400">
                        <span>{c.mentors.map((m) => m.name || m).join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-rose-400 text-xs">No mentor assigned</span>
                    )}
                  </td>
                  <td>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Program Modal */}
      <Modal isOpen={showProgramModal} onClose={() => setShowProgramModal(false)} title="Create Mentorship Program">
        <form onSubmit={handleCreateProgram} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Program Name</label>
            <input
              type="text"
              value={progName}
              onChange={(e) => setProgName(e.target.value)}
              placeholder="e.g. Full-Stack Foundations 2026"
              required
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={progDesc}
              onChange={(e) => setProgDesc(e.target.value)}
              placeholder="Curriculum overview and objectives..."
              rows={3}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={progTags}
              onChange={(e) => setProgTags(e.target.value)}
              placeholder="web, javascript, react, backend"
              className="input-base text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowProgramModal(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Create Program
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Cohort Modal */}
      <Modal isOpen={showCohortModal} onClose={() => setShowCohortModal(false)} title="Configure New Cohort">
        <form onSubmit={handleCreateCohort} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Assign to Program</label>
            <select
              value={selectedProgId}
              onChange={(e) => setSelectedProgId(e.target.value)}
              className="input-base text-xs"
            >
              {programs.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cohort Name</label>
            <input
              type="text"
              value={cohortName}
              onChange={(e) => setCohortName(e.target.value)}
              placeholder="e.g. Alpha Cohort — Winter 2026"
              required
              className="input-base text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="input-base text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Student Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              max="1000"
              className="input-base text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCohortModal(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Create Cohort
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
