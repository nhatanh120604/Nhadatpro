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

  if (!session) {
    redirect('/login');
  }

  if (!allowedRoles.includes(session.role)) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen md:flex">
      <SharedSidebar role={session.role} fullName={session.email} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-brand-border/80 bg-[#fffaf4]/85 backdrop-blur-md">
          <div className="flex h-20 items-center justify-between gap-4 px-4 md:px-8">
            <div className="hidden w-full max-w-xl items-center gap-3 rounded-2xl border border-brand-border bg-white/80 px-4 py-3 shadow-sm md:flex">
              <Search className="h-4 w-4 text-brand-muted" />
              <input
                aria-label="Tìm kiếm"
                className="w-full border-0 bg-transparent p-0 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
                placeholder="Tìm kiếm bất động sản, căn hộ, hợp đồng..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <button className="btn-ghost h-11 w-11 border border-brand-border bg-white/80 text-brand-muted">
                <Bell className="h-4 w-4" />
              </button>
              <button className="btn-ghost h-11 w-11 border border-brand-border bg-white/80 text-brand-muted">
                <MessageSquare className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-3 rounded-2xl border border-brand-border bg-white/85 px-3 py-2 shadow-sm md:flex">
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-ink">{session.email || 'Tài khoản'}</p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">
                    {session.role === 'OWNER'
                      ? 'Chủ sở hữu'
                      : session.role === 'MANAGER'
                        ? 'Quản gia'
                        : session.role === 'TENANT'
                          ? 'Người thuê'
                          : 'Quản trị'}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary-deep to-brand-primary text-white shadow-lg shadow-amber-900/20">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
