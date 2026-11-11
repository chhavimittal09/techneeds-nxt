'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function MenteeLayout({ children }) {
  const { user, loading, isMentee } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'mentee')) {
      router.push('/login?role=mentee');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'mentee') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 text-xs">
        Loading mentee workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background selection:bg-indigo-500/20">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="TechNeeds NXT — Learning Workspace" />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
