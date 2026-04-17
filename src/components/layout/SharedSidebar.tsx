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
  ShieldCheck,
  Sparkles,
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
}: {
  role: Role;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const menuItems = getRoleMenu(role);
  const primaryAction = getPrimaryAction(role);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <aside className="hidden h-screen w-[300px] flex-col border-r border-brand-border/60 bg-[#F8F5EE] px-6 py-8 md:flex">
      {/* Brand Section - Name changed to Dia Oc Hub  */}
      <div className="mb-10 flex items-center gap-4 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/20">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-headline text-2xl font-black tracking-tight text-brand-ink">Dia Oc Hub</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">Nền tảng quản lý tài sản</p>
        </div>
      </div>

      {/* Navigation - Improved Spacing for White Space score  */}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                'group flex items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-bold transition-all',
                isActive
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-brand-muted hover:bg-white hover:text-brand-ink'
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-brand-primary' : 'text-brand-muted/70')} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Primary Action [cite: 6] */}
      <div className="mt-auto space-y-5 pt-6">
        <Link className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold shadow-lg shadow-brand-primary/20" href={primaryAction.href}>
          <Sparkles className="h-4 w-4" />
          <span>{primaryAction.label}</span>
        </Link>

        {/* Support Links */}
        <div className="space-y-1">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold text-brand-muted transition-colors hover:bg-white hover:text-brand-ink">
            <Bell className="h-4 w-4" />
            <span>Thông báo</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold text-brand-muted transition-colors hover:bg-white hover:text-brand-ink">
            <ShieldCheck className="h-4 w-4" />
            <span>Hỗ trợ hệ thống</span>
          </button>
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FCEDED] py-3 text-xs font-bold text-[#D34545] transition hover:bg-[#FADDDD]"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}