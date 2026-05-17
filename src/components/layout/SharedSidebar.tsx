'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  FileText,
  LayoutGrid,
  PiggyBank,
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
  { title: 'Thanh toán', href: '/tenant/payments', icon: Wallet },
  { title: 'Hợp đồng', href: '/tenant/contracts', icon: FileText },
];

const ownerMenu: SidebarItem[] = [
  { title: 'Bảng điều khiển', href: '/owner/dashboard', icon: LayoutGrid },
  { title: 'Tài sản', href: '/owner/properties', icon: Building2 },
  { title: 'Tài chính', href: '/owner/finance', icon: PiggyBank },
];

const managerMenu: SidebarItem[] = [
  { title: 'Bảng điều khiển', href: '/manager/dashboard', icon: LayoutGrid },
  { title: 'Tài sản được giao', href: '/manager/properties', icon: Building2 },
  { title: 'Tài chính', href: '/manager/finance', icon: PiggyBank },
];

function getRoleMenu(role: Role) {
  if (role === 'OWNER') return ownerMenu;
  if (role === 'MANAGER' || role === 'ADMIN') return managerMenu;
  return tenantMenu;
}

export function SharedSidebar({
  role,
}: {
  role: Role;
}) {
  const pathname = usePathname();
  const menuItems = getRoleMenu(role);

  return (
    <aside className="hidden h-screen w-[300px] flex-col border-r border-brand-border/60 bg-[#F8F5EE] px-6 py-8 md:flex">
      <div className="mb-10 flex items-center gap-4 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/20">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-headline text-2xl font-black tracking-tight text-brand-ink">Địa Ốc Hub</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">Nền tảng quản lý bất động sản</p>
        </div>
      </div>

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

    </aside>
  );
}
