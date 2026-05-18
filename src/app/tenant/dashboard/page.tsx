'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CalendarClock, FileText } from 'lucide-react';
import { getTenantConnectionState } from '@/features/leases/leases.actions';
import { listTenantInvoices } from '@/features/invoices/invoices.actions';

type ConnectionState = {
  activeLeases: {
    leaseId: string;
    propertyName: string;
    propertyId: string;
    unitCode: string;
    endDate?: string;
  }[];
  pendingRequests: {
    requestId: string;
    propertyName: string;
    propertyId: string;
    unitCode: string;
    requestedAt: string;
  }[];
};

type DueInvoice = {
  invoiceId: string;
  invoiceCode: string;
  propertyName: string;
  unitCode: string;
  dueDate: string | null;
  totalAmount: string;
  remainingBalance: string;
  status: string;
};

function formatMoney(value: string) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

function invoiceStatusLabel(status: string) {
  switch (status) {
    case 'PAID':
      return 'Đã thanh toán';
    case 'OVERDUE':
      return 'Quá hạn';
    case 'PARTIAL':
      return 'Thanh toán một phần';
    case 'PENDING':
      return 'Chờ duyệt thanh toán';
    case 'UNPAID':
    case 'ISSUED':
      return 'Chưa thanh toán';
    default:
      return status;
  }
}

export default function TenantDashboardPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [stateResponse, invoiceResponse] = await Promise.all([
      getTenantConnectionState(),
      listTenantInvoices(),
    ]);
    if (stateResponse.success && stateResponse.data) {
      setConnectionState(stateResponse.data);
    }
    if (invoiceResponse.success && invoiceResponse.data) {
      const outstanding = invoiceResponse.data
        .filter((inv) => inv.status !== 'PAID' && Number(inv.remainingBalance) > 0)
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        })
        .slice(0, 6);
      setDueInvoices(outstanding);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return <p className="text-sm text-brand-muted">Đang tải bảng điều khiển...</p>;
  }

  return (
    <div className="space-y-8">
      {connectionState && connectionState.activeLeases.length > 0 ? (
        <section className="shell-card p-7 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="warm-badge">Hợp đồng đang hiệu lực</p>
              <h1 className="mt-5 font-headline text-4xl font-extrabold text-brand-ink">Các căn hộ đang thuê</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">
                Bạn có thể quản lý nhiều hợp đồng thuê cùng lúc. Mỗi căn hộ sẽ có hóa đơn, lịch thanh toán và yêu cầu chấm dứt riêng.
              </p>
            </div>
            <Link className="btn-primary px-5 py-3.5 text-sm" href="/tenant/contracts">
              Xem hợp đồng
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {connectionState.activeLeases.map((lease) => (
              <div className="shell-panel p-5" key={lease.leaseId}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary-deep">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-ink">{lease.propertyName}</p>
                    <p className="text-sm text-brand-muted">Căn hộ {lease.unitCode}</p>
                  </div>
                </div>
                <div className="mt-5 shell-muted p-4">
                  <p className="text-sm text-brand-muted">Ngày kết thúc</p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink">
                    {lease.endDate ? new Date(lease.endDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {dueInvoices.length > 0 ? (
        <section className="shell-card p-7 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="warm-badge">Hóa đơn cần thanh toán</p>
              <h2 className="mt-5 font-headline text-3xl font-extrabold text-brand-ink">Đến hạn thanh toán</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">
                Theo dõi các hóa đơn chưa hoàn tất. Hóa đơn quá hạn sẽ được đánh dấu để bạn ưu tiên xử lý.
              </p>
            </div>
            <Link className="btn-primary px-5 py-3.5 text-sm" href="/tenant/payments">
              Đi đến thanh toán
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dueInvoices.map((invoice) => {
              const isOverdue = invoice.status === 'OVERDUE';
              return (
                <div className="shell-panel p-5" key={invoice.invoiceId}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-brand-primary/10 text-brand-primary-deep'}`}>
                      <CalendarClock className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand-ink">{invoice.propertyName}</p>
                      <p className="truncate text-sm text-brand-muted">Căn {invoice.unitCode} · {invoice.invoiceCode}</p>
                    </div>
                  </div>
                  <div className="mt-5 shell-muted p-4">
                    <div className="flex items-center justify-between text-sm text-brand-muted">
                      <span>Ngày đến hạn</span>
                      <span className={`font-semibold ${isOverdue ? 'text-red-700' : 'text-brand-ink'}`}>
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-brand-muted">
                      <span>Còn phải trả</span>
                      <span className="font-semibold text-brand-ink">{formatMoney(invoice.remainingBalance)}</span>
                    </div>
                    <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.18em] ${isOverdue ? 'text-red-700' : 'text-brand-primary-deep'}`}>
                      {invoiceStatusLabel(invoice.status)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

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
