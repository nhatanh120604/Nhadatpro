'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardList, Wallet } from 'lucide-react';
import { getDashboardMetrics, type DashboardMetrics } from '@/features/dashboard/dashboard.actions';
import {
  getManagerAssignmentState,
  leaveManagedProperty,
  requestPropertyManagerAssignment,
} from '@/features/managerAssignments/managerAssignments.actions';

type AssignmentState = {
  assignedPropertyCount: number;
  assignedProperties: {
    propertyId: string;
    propertyName: string;
  }[];
  pendingRequests: {
    requestId: string;
    propertyId: string;
    propertyName: string;
    requestedAt: string;
  }[];
};

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
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

function money(value: string) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

export default function ManagerDashboardPage() {
  const [assignmentState, setAssignmentState] = useState<AssignmentState | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const stateResponse = await getManagerAssignmentState();
    if (stateResponse.success && stateResponse.data) {
      setAssignmentState(stateResponse.data);

      if (stateResponse.data.assignedPropertyCount > 0) {
        const metricsResponse = await getDashboardMetrics();
        if (metricsResponse.success && metricsResponse.data) {
          setMetrics(metricsResponse.data);
        } else {
          setError(metricsResponse.message || 'Không thể tải số liệu bảng điều khiển');
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const response = await requestPropertyManagerAssignment({ inviteCode });
    if (!response.success) {
      setError(response.message || 'Không thể gửi yêu cầu nhận quản lý');
      setSubmitting(false);
      return;
    }

    setInviteCode('');
    await load();
    setSubmitting(false);
  };

  const handleLeaveProperty = async (propertyId: string, propertyName: string) => {
    const confirmed = window.confirm(
      `Ngừng quản lý ${propertyName}? Lịch sử phân công vẫn sẽ được giữ lại để báo cáo.`
    );
    if (!confirmed) {
      return;
    }

    setError('');
    const response = await leaveManagedProperty({ propertyId });
    if (!response.success) {
      setError(response.message || 'Không thể rời khỏi tài sản này');
      return;
    }

    await load();
  };

  if (loading) {
    return <p className="text-sm text-brand-muted">Đang tải bảng điều khiển...</p>;
  }

  if ((assignmentState?.assignedPropertyCount ?? 0) === 0) {
    return (
      <div className="space-y-6">
        <div className="shell-card mx-auto max-w-3xl p-8 md:p-10">
          <p className="warm-badge">Kết nối tài sản</p>
          <h1 className="mt-5 font-headline text-4xl font-extrabold text-brand-ink">Nhập mã quản lý tài sản</h1>
          <p className="mt-4 text-base leading-7 text-brand-muted">
            Bạn có thể gửi yêu cầu đến nhiều chủ sở hữu khác nhau. Mỗi tài sản chỉ có một quản gia đang hoạt động tại một thời điểm.
          </p>

          {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              className="input-shell"
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder="Nhập mã dạng MGR-XXXX-XXXX"
              type="text"
              value={inviteCode}
            />
            <button className="btn-primary px-5 py-4 text-base" disabled={submitting} type="submit">
              {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu nhận quản lý'}
            </button>
          </form>
        </div>

        {assignmentState && assignmentState.pendingRequests.length > 0 ? (
          <div className="mx-auto max-w-3xl shell-card p-8">
            <h2 className="font-headline text-2xl font-bold text-brand-ink">Yêu cầu đang chờ</h2>
            <div className="mt-5 space-y-3">
              {assignmentState.pendingRequests.map((request) => (
                <div className="shell-muted p-4" key={request.requestId}>
                  <p className="font-semibold text-brand-ink">{request.propertyName}</p>
                  <p className="mt-2 text-sm text-brand-muted">Gửi lúc {new Date(request.requestedAt).toLocaleString('vi-VN')}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const activeAssignmentState = assignmentState!;

  return (
    <div className="space-y-8">
      <section className="shell-card p-7 md:p-8">
        <p className="warm-badge">Tổng quan</p>
        <h1 className="mt-5 font-headline text-5xl font-extrabold text-brand-ink">Bảng điều khiển quản gia</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-brand-muted">
          Theo dõi các bất động sản bạn đang phụ trách và xử lý hóa đơn, thanh toán hàng tháng.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary px-5 py-3.5 text-sm" href="/manager/properties">
            Xem danh sách tài sản
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard icon={Wallet} label="Đã thu tháng này" value={money(metrics?.currentMonthPaid ?? '0')} />
        <StatCard icon={ClipboardList} label="Thanh toán chờ duyệt" value={String(metrics?.pendingPaymentReviewCount ?? 0)} />
      </section>

      <section className="shell-card p-6">
        <h2 className="font-headline text-2xl font-bold text-brand-ink">Tài sản đang quản lý</h2>
        <div className="mt-5 space-y-3">
          {activeAssignmentState.assignedProperties.map((property) => (
            <div className="shell-muted p-4" key={property.propertyId}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-brand-ink">{property.propertyName}</p>
                <button
                  className="btn-secondary px-4 py-2 text-xs"
                  onClick={() => void handleLeaveProperty(property.propertyId, property.propertyName)}
                  type="button"
                >
                  Ngừng quản lý
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
