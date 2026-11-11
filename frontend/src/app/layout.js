import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'TECHNEEDS NXT — Next Generation Mentorship | TechNeeds IGDTUW',
  description: 'The premier technical mentorship platform of IGDTUW. Multi-tiered role hierarchies, AI-driven profile constellations, granular tracking, and gamified leaderboards.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-white">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
