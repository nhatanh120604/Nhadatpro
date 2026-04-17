'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Building2, ClipboardList, DoorOpen } from 'lucide-react';
import { getDashboardMetrics, type DashboardMetrics } from '@/features/dashboard/dashboard.actions';

function StatCard({
  label,
  value,
  icon: Icon,
  emptyActionLabel,
  emptyActionHref,
  showEmptyAction = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  showEmptyAction?: boolean;
}) {
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">{label}</p>
          <p className="mt-3 font-headline text-4xl font-extrabold text-brand-ink">{value}</p>
          {showEmptyAction && emptyActionLabel && emptyActionHref ? (
            <Link className="mt-2 inline-flex text-xs font-semibold text-brand-primary transition-colors hover:text-brand-primary-deep" href={emptyActionHref}>
              {emptyActionLabel}
            </Link>
          ) : null}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const totalProperties = metrics?.totalProperties ?? 0;
  const totalUnits = metrics?.totalUnits ?? 0;
  const occupiedUnits = metrics?.occupiedUnits ?? 0;

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
           Kiểm soát toàn diện tài sản, hợp đồng và khách thuê của bạn
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-brand-muted">
            Theo dõi nhanh hiệu suất vận hành để ra quyết định về hợp đồng, phân công quản lý và khai thác tài sản hiệu quả hơn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-secondary px-5 py-3.5 text-sm" href="/owner/properties">
              Xem danh sách tài sản
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn-ghost px-4 py-3 text-sm font-semibold" href="/owner/requests">
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

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          emptyActionHref="/owner/properties/new"
          emptyActionLabel="Tạo tài sản đầu tiên"
          icon={Building2}
          label="Tổng tài sản"
          showEmptyAction={totalProperties === 0}
          value={String(totalProperties)}
        />
        <StatCard icon={DoorOpen} label="Tổng căn hộ" value={String(totalUnits)} />
        <StatCard icon={ClipboardList} label="Đã lấp đầy" value={String(occupiedUnits)} />
      </section>
    </div>
  );
}
