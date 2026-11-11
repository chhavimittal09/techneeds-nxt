'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Shield, GraduationCap, Users, ArrowRight, Eye, EyeOff, AlertCircle, Check } from '@/components/Icons';

export default function LoginPage() {
  const [tab, setTab] = useState('mentee'); // 'mentee' | 'mentor' | 'admin'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qId = searchParams.get('id');
    const qRole = searchParams.get('role');
    if (qId) setIdentifier(qId);
    if (qRole === 'admin') setTab('admin');
    else if (qRole === 'mentor') setTab('mentor');
    else if (qRole === 'mentee') setTab('mentee');
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'mentor') router.push('/mentor');
      else router.push('/mentee');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedUser = await login({
        identifier: identifier.trim(),
        password,
        role: tab
      });

      if (loggedUser.role === 'admin') router.push('/admin');
      else if (loggedUser.role === 'mentor') router.push('/mentor');
      else router.push('/mentee');
    } catch (err) {
      setError(err.message || 'Invalid sign-in credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (id, pass, role) => {
    setTab(role);
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background bg-radial-glow relative selection:bg-indigo-500/20">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 text-center mb-8 space-y-2">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-glow-primary">
            <span className="font-extrabold text-white text-sm tracking-wider">TN</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-white tracking-wider flex items-center gap-1.5">
              TECHNEEDS <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-mono font-bold">NXT</span>
            </span>
            <span className="text-[11px] text-slate-400">IGDTUW Technical Society</span>
          </div>
        </Link>
        <p className="text-xs text-slate-400">Authenticate to access your assigned mentorship workspace</p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-surface-200 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Role Tabs */}
        <div className="flex p-1 rounded-xl bg-surface-300 border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setTab('mentee'); setError(''); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'mentee' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} /> Mentee
          </button>
          <button
            type="button"
            onClick={() => { setTab('mentor'); setError(''); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'mentor' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap size={14} /> Mentor
          </button>
          <button
            type="button"
            onClick={() => { setTab('admin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'admin' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield size={14} /> Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {tab === 'mentee' ? 'Enrollment Number' : 'Email Address'}
            </label>
            <input
              type={tab === 'mentee' ? 'text' : 'email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={tab === 'mentee' ? 'e.g. TNX260001' : 'e.g. mentor.demo@techneeds.local'}
              required
              className="input-base text-xs font-mono uppercase"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="input-base text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold shadow-glow-primary flex items-center justify-center gap-2 mt-2"
          >
            <span>{submitting ? 'Authenticating...' : `Sign in as ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Demo Credentials Auto-Fill for Judges */}
        <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Judge Quick Fill (Click to autofill)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('TNX260001', 'Demo@12345', 'mentee')}
              className="px-2 py-1.5 rounded-lg bg-surface-300 border border-white/5 hover:border-emerald-500/30 text-[10px] text-slate-300 text-center transition-colors truncate"
            >
              Mentee
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('mentor.demo@techneeds.local', 'Demo@12345', 'mentor')}
              className="px-2 py-1.5 rounded-lg bg-surface-300 border border-white/5 hover:border-violet-500/30 text-[10px] text-slate-300 text-center transition-colors truncate"
            >
              Mentor
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@techneeds.local', 'ChangeMe-Admin-123', 'admin')}
              className="px-2 py-1.5 rounded-lg bg-surface-300 border border-white/5 hover:border-indigo-500/30 text-[10px] text-slate-300 text-center transition-colors truncate"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300 transition-colors">
          ← Back to TechNeeds Home
        </Link>
      </div>
    </div>
  );
}
