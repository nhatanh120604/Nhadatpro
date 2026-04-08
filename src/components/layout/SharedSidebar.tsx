'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Bell,
  Building2,
  ClipboardList,
  FileText,
  LayoutGrid,
  LogOut,
  PiggyBank,
  Search,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { Role } from '@/features/auth/auth.types';

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

const tenantMenu: SidebarItem[] = [
  { title: 'Bảng điều khiển', href: '/tenant/dashboard', icon: LayoutGrid },
  { title: 'Hợp đồng', href: '/tenant/contracts', icon: FileText },
];

const ownerMenu: SidebarItem[] = [
  { title: 'Bảng điều khiển', href: '/owner/dashboard', icon: LayoutGrid },
  { title: 'Tài sản', href: '/owner/properties', icon: Building2 },
  { title: 'Yêu cầu', href: '/owner/requests', icon: ClipboardList },
  { title: 'Doanh thu', href: '/owner/revenue', icon: PiggyBank },
  { title: 'Thu tiền', href: '/owner/invoices', icon: Wallet },
];

const managerMenu: SidebarItem[] = [
  { title: 'Bảng điều khiển', href: '/manager/dashboard', icon: LayoutGrid },
  { title: 'Tài sản được giao', href: '/manager/properties', icon: Building2 },
  { title: 'Yêu cầu xử lý', href: '/manager/requests', icon: ClipboardList },
  { title: 'Thu tiền', href: '/manager/invoices', icon: Wallet },
];

function getRoleLabel(role: Role) {
  if (role === 'OWNER') return 'Chủ sở hữu';
  if (role === 'MANAGER') return 'Quản gia';
  if (role === 'TENANT') return 'Người thuê';
  return 'Quản trị';
}

function getRoleMenu(role: Role) {
  if (role === 'OWNER') return ownerMenu;
  if (role === 'MANAGER' || role === 'ADMIN') return managerMenu;
  return tenantMenu;
}

function getPrimaryAction(role: Role) {
  if (role === 'OWNER') {
    return { href: '/owner/properties/new', label: 'Thêm tài sản' };
  }

  if (role === 'MANAGER' || role === 'ADMIN') {
    return { href: '/manager/properties', label: 'Xem tài sản' };
  }

  return { href: '/tenant/contracts', label: 'Xem hợp đồng' };
}

export function SharedSidebar({
  role,
  fullName,
}: {
  role: Role;
  fullName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const menuItems = getRoleMenu(role);
  const roleLabel = getRoleLabel(role);
  const primaryAction = getPrimaryAction(role);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <aside className="hidden h-screen w-[290px] flex-col border-r border-brand-border/80 bg-gradient-to-b from-[#fbf6ef] via-[#f8f1e8] to-[#f5efe7] px-5 py-5 md:flex">
      <div className="shell-panel flex items-center gap-4 px-4 py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary-deep to-brand-primary text-white shadow-lg shadow-amber-900/20">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-headline text-2xl font-extrabold text-brand-ink">Nha Dat Pro</p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">Nền tảng quản lý tài sản</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-brand-border bg-white/70 px-4 py-3 text-sm text-brand-muted">
        <Search className="h-4 w-4" />
        <span>Tìm nhanh danh mục</span>
      </div>

      <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                'group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-white text-brand-primary-deep shadow-md shadow-amber-950/5'
                  : 'text-brand-muted hover:bg-white/70 hover:text-brand-ink'
              )}
              href={item.href}
              key={item.href}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl border transition-all',
                  isActive
                    ? 'border-amber-200 bg-amber-50 text-brand-primary-deep'
                    : 'border-transparent bg-transparent text-brand-muted group-hover:border-brand-border group-hover:bg-white'
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
              </span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <Link className="btn-primary mt-4 w-full px-4 py-3 text-sm" href={primaryAction.href}>
        <Sparkles className="h-4 w-4" />
        <span>{primaryAction.label}</span>
      </Link>

      <div className="mt-5 space-y-2">
        <button className="btn-ghost w-full justify-start px-4 py-3 text-sm">
          <Bell className="h-4 w-4" />
          <span>Thông báo</span>
        </button>
        <button className="btn-ghost w-full justify-start px-4 py-3 text-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Hỗ trợ</span>
        </button>
      </div>

      <div className="shell-panel mt-5 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d2a26] text-white shadow-lg shadow-stone-900/10">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-ink">{fullName || roleLabel}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">{roleLabel}</p>
          </div>
        </div>
        <button
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
