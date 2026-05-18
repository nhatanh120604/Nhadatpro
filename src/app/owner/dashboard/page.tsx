'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, DoorOpen, TrendingUp, Wallet } from 'lucide-react';
import { getDashboardMetrics, type DashboardMetrics } from '@/features/dashboard/dashboard.actions';

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">{label}</p>
          <p className="mt-3 font-headline text-4xl font-extrabold text-brand-ink">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function money(value: string) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

export default function OwnerDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const occupiedUnits = metrics?.occupiedUnits ?? 0;

  useEffect(() => {
    async function load() {
      const response = await getDashboardMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
        setError('');
      } else {
        setError(response.message || 'Không thể tải số liệu bảng điều khiển');
      }
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <div className="space-y-8">
      <section className="shell-card p-7 md:p-8">
        <p className="warm-badge">Tổng quan</p>
        <h1 className="mt-5 max-w-2xl font-headline text-5xl font-extrabold leading-tight text-brand-ink">
          Bảng điều khiển chủ sở hữu
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-brand-muted">
          Theo dõi tình hình tài sản, hợp đồng và dòng tiền của bạn ở một nơi duy nhất.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-secondary px-5 py-3.5 text-sm" href="/owner/properties">
            Xem danh sách tài sản
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {loading ? <p className="text-sm text-brand-muted">Đang tải số liệu...</p> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={DoorOpen} label="Đã có người thuê" value={String(occupiedUnits)} />
        <StatCard icon={Wallet} label="Đã thu tháng này" value={money(metrics?.currentMonthPaid ?? '0')} />
        <StatCard icon={TrendingUp} label="Lợi nhuận ròng" value={money(metrics?.currentMonthNetIncome ?? '0')} />
      </section>
    </div>
  );
}
