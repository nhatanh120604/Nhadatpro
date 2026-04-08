'use client';

import { useEffect, useState } from 'react';
import { FileText, Send } from 'lucide-react';
import { getTenantContract, requestEarlyTermination } from '@/features/leases/leases.actions';

type TenantContract = {
  leaseId: string;
  propertyName: string;
  propertyId: string;
  unitCode: string;
  startDate: string;
  endDate: string;
  dueDayOfMonth: number;
  baseRent: string;
  depositAmount: string;
  managementFee: string;
  utilityNote: string | null;
  status: string;
  terminationRequestedAt: string | null;
  terminationRequestedNote: string | null;
  terminatedAt: string | null;
};

function money(value: string) {
  return `${Number(value).toLocaleString('vi-VN')} VNĐ`;
}

export default function TenantContractsPage() {
  const [contract, setContract] = useState<TenantContract | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const response = await getTenantContract();
    if (response.success && response.data) {
      setContract(response.data);
      setError('');
    } else {
      setError(response.message || 'Không thể tải hợp đồng');
    }

    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleRequestTermination = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract) return;

    setSubmitting(true);
    setError('');

    const response = await requestEarlyTermination({
      leaseId: contract.leaseId,
      note,
    });

    if (!response.success) {
      setError(response.message || 'Không thể gửi yêu cầu chấm dứt');
      setSubmitting(false);
      return;
    }

    setNote('');
    await load();
    setSubmitting(false);
  };

  if (loading) {
    return <p className="text-sm text-brand-muted">Đang tải hợp đồng...</p>;
  }

  if (!contract) {
    return (
      <div className="shell-card p-8">
        <h1 className="font-headline text-3xl font-extrabold text-brand-ink">Chưa có hợp đồng</h1>
        <p className="mt-3 text-base leading-7 text-brand-muted">Hãy kết nối với căn hộ trước để xem toàn bộ thông tin hợp đồng tại đây.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="shell-card p-7 md:p-8">
        <p className="warm-badge">Thông tin hợp đồng</p>
        <h1 className="mt-5 font-headline text-5xl font-extrabold text-brand-ink">{contract.propertyName}</h1>
        <p className="mt-3 text-lg text-brand-muted">Căn hộ {contract.unitCode}</p>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Trạng thái</p>
          <p className="mt-3 font-headline text-3xl font-extrabold text-brand-ink">{contract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}</p>
        </div>
        <div className="stat-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Tiền thuê</p>
          <p className="mt-3 font-headline text-3xl font-extrabold text-brand-ink">{money(contract.baseRent)}</p>
        </div>
        <div className="stat-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Ngày đến hạn</p>
          <p className="mt-3 font-headline text-3xl font-extrabold text-brand-ink">Ngày {contract.dueDayOfMonth}</p>
        </div>
        <div className="stat-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Phí quản lý</p>
          <p className="mt-3 font-headline text-3xl font-extrabold text-brand-ink">{money(contract.managementFee)}</p>
        </div>
      </section>

      <section className="shell-card p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="shell-muted p-4">
            <p className="text-sm text-brand-muted">Ngày bắt đầu</p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="shell-muted p-4">
            <p className="text-sm text-brand-muted">Ngày kết thúc</p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="shell-muted p-4">
            <p className="text-sm text-brand-muted">Tiền cọc</p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">{money(contract.depositAmount)}</p>
          </div>
          <div className="shell-muted p-4">
            <p className="text-sm text-brand-muted">Phí quản lý</p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">{money(contract.managementFee)}</p>
          </div>
        </div>
        {contract.utilityNote ? <div className="mt-5 shell-muted p-4 text-sm leading-7 text-brand-muted">{contract.utilityNote}</div> : null}
      </section>

      {contract.status === 'ACTIVE' ? (
        contract.terminationRequestedAt ? (
          <section className="shell-card p-7">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-brand-primary-deep" />
              <h2 className="font-headline text-2xl font-bold text-brand-ink">Yêu cầu chấm dứt đã được gửi</h2>
            </div>
            <p className="mt-4 text-base leading-7 text-brand-muted">
              Yêu cầu của bạn đã được gửi vào lúc {new Date(contract.terminationRequestedAt).toLocaleString('vi-VN')}.
            </p>
            {contract.terminationRequestedNote ? <div className="mt-4 shell-muted p-4 text-sm leading-7 text-brand-muted">{contract.terminationRequestedNote}</div> : null}
          </section>
        ) : (
          <form className="shell-card space-y-5 p-7" onSubmit={handleRequestTermination}>
            <div>
              <h2 className="font-headline text-2xl font-bold text-brand-ink">Yêu cầu chấm dứt sớm</h2>
              <p className="mt-3 text-base leading-7 text-brand-muted">
                Yêu cầu này sẽ được gửi đến chủ nhà hoặc quản gia để xem xét. Hợp đồng sẽ chưa tự động kết thúc.
              </p>
            </div>
            <textarea
              className="input-shell min-h-32"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Mô tả lý do chuyển đi hoặc thời điểm bạn mong muốn bàn giao"
              value={note}
            />
            <button className="btn-primary px-5 py-4 text-base" disabled={submitting} type="submit">
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu chấm dứt'}</span>
            </button>
          </form>
        )
      ) : null}
    </div>
  );
}
