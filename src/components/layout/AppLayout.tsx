import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { SharedSidebar } from './SharedSidebar';
import { Role } from '@/features/auth/auth.types';
import { Bell, MessageSquare, Search, Sparkles } from 'lucide-react';

export default async function AppLayout({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!allowedRoles.includes(session.role)) redirect('/login');

  return (
    <div className="min-h-screen bg-[#F8F5EE] md:flex">
      <SharedSidebar role={session.role} />

      <div className="min-w-0 flex-1">
        {/* Simplified Header - Improved Simplicity */}
        <header className="sticky top-0 z-30 bg-[#F8F5EE]/85 backdrop-blur-xl">
          <div className="flex h-24 items-center justify-between gap-8 px-8 md:px-12">
            <div className="relative hidden w-full max-w-md items-center md:flex">
              <Search className="absolute left-4 h-4 w-4 text-brand-muted/60" />
              <input
                aria-label="Tìm kiếm"
                className="w-full rounded-2xl border border-brand-border/70 bg-white py-3.5 pl-11 pr-4 text-sm text-brand-ink outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20 placeholder:text-brand-muted/70"
                placeholder="Tìm bất động sản, hợp đồng..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl text-brand-muted transition-colors hover:bg-brand-soft hover:text-brand-ink">
                  <MessageSquare className="h-5 w-5" />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl text-brand-muted transition-colors hover:bg-brand-soft hover:text-brand-ink">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
              
              <div className="h-8 w-px bg-brand-border/60" />

              <div className="flex items-center gap-4">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-bold text-brand-ink">{session.email}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary-deep">
                    {session.role}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary-deep to-brand-primary text-white shadow-lg shadow-brand-primary/25">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-8 pb-12 pt-4 md:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}