'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import InvoiceManagementPage from '@/components/invoices/InvoiceManagementPage';
import RevenueManagementPage from '@/components/expenses/RevenueManagementPage';
import { getRevenueAnalytics, type RevenueAnalytics } from '@/features/expenses/expenses.actions';

type Tab = 'invoices' | 'revenue';

function money(value: string) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">{label}</p>
      <p className="mt-3 font-headline text-3xl font-extrabold text-brand-ink">{value}</p>
    </div>
  );
}

export default function FinancePage({ roleBase }: { roleBase: 'owner' | 'manager' }) {
  const [tab, setTab] = useState<Tab>('invoices');
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);

  useEffect(() => {
    const now = new Date();
    void getRevenueAnalytics({
      billingYear: now.getFullYear(),
      billingMonth: now.getMonth() + 1,
      propertyId: '',
      status: 'ACTIVE',
    }).then((res) => {
      if (res.success && res.data) setAnalytics(res.data);
    });
  }, []);

  return (
    <div className="space-y-6">
      <section className="shell-card p-7 md:p-8">
        <p className="warm-badge">Tài chính</p>
        <h1 className="mt-5 font-headline text-5xl font-extrabold text-brand-ink">
          {roleBase === 'owner' ? 'Tài chính chủ nhà' : 'Quản lý tài chính'}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-brand-muted">
          Chuyển sang các tab phía dưới để xem chi tiết hóa đơn hoặc chi phí.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Đã thu tháng này"
          value={`${money(analytics?.totalPaid ?? '0')} / ${money(analytics?.totalInvoiced ?? '0')}`}
        />
        <StatTile label="Chi phí tháng này" value={money(analytics?.totalExpenses ?? '0')} />
        <StatTile label="Lợi nhuận ròng" value={money(analytics?.netOperatingIncome ?? '0')} />
      </section>

      <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm">
        <button
          className={cn(
            'rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
            tab === 'invoices' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-ink'
          )}
          onClick={() => setTab('invoices')}
          type="button"
        >
          Thu tiền & Hóa đơn
        </button>
        <button
          className={cn(
            'rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
            tab === 'revenue' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-ink'
          )}
          onClick={() => setTab('revenue')}
          type="button"
        >
          Doanh thu & Chi phí
        </button>
      </div>

      {tab === 'invoices' ? (
        <InvoiceManagementPage roleBase={roleBase} />
      ) : (
        <RevenueManagementPage roleBase={roleBase} />
      )}
    </div>
  );
}
