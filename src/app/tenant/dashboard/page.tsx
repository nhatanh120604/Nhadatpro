'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, FileText, Send } from 'lucide-react';
import { getTenantConnectionState, requestUnitConnection } from '@/features/leases/leases.actions';

type ConnectionState = {
  activeLease: {
    leaseId: string;
    propertyName: string;
    propertyId: string;
    unitCode: string;
    endDate?: string;
  } | null;
  pendingRequests: {
    requestId: string;
    propertyName: string;
    propertyId: string;
    unitCode: string;
    requestedAt: string;
  }[];
};

export default function TenantDashboardPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await getTenantConnectionState();
    if (response.success && response.data) {
      setConnectionState(response.data);
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

    const response = await requestUnitConnection({ inviteCode });
    if (!response.success) {
      setError(response.message || 'Không thể gửi yêu cầu kết nối');
      setSubmitting(false);
      return;
    }

    setInviteCode('');
    await load();
    setSubmitting(false);
  };

  if (loading) {
    return <p className="text-sm text-brand-muted">Đang tải bảng điều khiển...</p>;
  }

  if (connectionState?.activeLease) {
    return (
      <div className="space-y-8">
        <section className="shell-card grid gap-6 p-7 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <p className="warm-badge">Hợp đồng đang hiệu lực</p>
            <h1 className="mt-5 font-headline text-5xl font-extrabold text-brand-ink">{connectionState.activeLease.propertyName}</h1>
            <p className="mt-3 text-lg text-brand-muted">Căn hộ {connectionState.activeLease.unitCode}</p>
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-muted">
              Bạn đang có hợp đồng còn hiệu lực. Mọi thông tin chi tiết về thời hạn, tiền thuê và yêu cầu chấm dứt sớm đều nằm trong màn hình hợp đồng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary px-5 py-3.5 text-sm" href="/tenant/contracts">
                Xem hợp đồng
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="shell-panel p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">Thời hạn thuê</p>
            <p className="mt-3 font-headline text-4xl font-extrabold text-brand-ink">
              {connectionState.activeLease.endDate ? new Date(connectionState.activeLease.endDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
            </p>
            <p className="mt-4 text-sm leading-7 text-brand-muted">Hãy theo dõi thời điểm kết thúc hợp đồng để chủ động gia hạn hoặc gửi yêu cầu chấm dứt sớm.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="shell-card mx-auto max-w-3xl p-8 md:p-10">
        <p className="warm-badge">Kết nối căn hộ</p>
        <h1 className="mt-5 font-headline text-4xl font-extrabold text-brand-ink">Nhập mã kết nối thuê nhà</h1>
        <p className="mt-4 text-base leading-7 text-brand-muted">
          Chủ nhà hoặc quản gia sẽ gửi cho bạn một mã kết nối để bắt đầu quy trình phê duyệt hợp đồng.
        </p>

        {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            className="input-shell"
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            placeholder="Nhập mã dạng UNIT-XXXX-XXXX"
            type="text"
            value={inviteCode}
          />
          <button className="btn-primary px-5 py-4 text-base" disabled={submitting} type="submit">
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu kết nối'}</span>
          </button>
        </form>
      </section>

      {connectionState && connectionState.pendingRequests.length > 0 ? (
        <section className="mx-auto max-w-3xl shell-card p-8">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-brand-primary-deep" />
            <h2 className="font-headline text-2xl font-bold text-brand-ink">Yêu cầu đang chờ</h2>
          </div>
          <div className="mt-5 space-y-3">
            {connectionState.pendingRequests.map((request) => (
              <div className="shell-muted p-4" key={request.requestId}>
                <p className="font-semibold text-brand-ink">{request.propertyName} · {request.unitCode}</p>
                <p className="mt-2 text-sm text-brand-muted">Gửi lúc {new Date(request.requestedAt).toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
