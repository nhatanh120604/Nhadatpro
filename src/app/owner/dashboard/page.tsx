'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Building2, ClipboardList, DoorOpen, Percent } from 'lucide-react';
import { getDashboardMetrics, type DashboardMetrics } from '@/features/dashboard/dashboard.actions';

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">{label}</p>
          <p className="mt-3 font-headline text-4xl font-extrabold text-brand-ink">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-brand-primary-deep">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await getDashboardMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
      }
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="shell-card p-7 md:p-8">
          <p className="warm-badge">Tổng quan danh mục</p>
          <h1 className="mt-5 max-w-2xl font-headline text-5xl font-extrabold leading-tight text-brand-ink">
            Quản lý tài sản, tỷ lệ lấp đầy và luồng yêu cầu trong một màn hình.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-brand-muted">
            Theo dõi nhanh hiệu suất vận hành để ra quyết định về hợp đồng, phân công quản lý và khai thác tài sản hiệu quả hơn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary px-5 py-3.5 text-sm" href="/owner/properties">
              Xem danh sách tài sản
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn-secondary px-5 py-3.5 text-sm" href="/owner/requests">
              Mở trung tâm yêu cầu
            </Link>
          </div>
        </div>

        <div className="shell-panel p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">Gợi ý hôm nay</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm font-semibold text-brand-ink">Ưu tiên kiểm tra các căn đang trống</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">Tỷ lệ lấp đầy sẽ cải thiện rõ hơn khi các căn trống được lên mã kết nối và giá thuê kịp thời.</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm font-semibold text-brand-ink">Duyệt yêu cầu tồn đọng</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">Xử lý các yêu cầu chờ sẽ giúp người thuê và quản gia vào quy trình nhanh hơn.</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? <p className="text-sm text-brand-muted">Đang tải số liệu...</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Tổng tài sản" value={String(metrics?.totalProperties ?? 0)} />
        <StatCard icon={DoorOpen} label="Tổng căn hộ" value={String(metrics?.totalUnits ?? 0)} />
        <StatCard icon={ClipboardList} label="Đã lấp đầy" value={String(metrics?.occupiedUnits ?? 0)} />
        <StatCard icon={Percent} label="Tỷ lệ lấp đầy" value={`${metrics?.occupancyRate ?? 0}%`} />
      </section>
    </div>
  );
}
