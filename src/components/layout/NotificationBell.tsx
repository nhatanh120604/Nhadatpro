'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCircle2, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Role } from '@/features/auth/auth.types';
import {
  getUnreadAlertCount,
  listMyAlerts,
  markAlertRead,
  markAllAlertsRead,
  type AlertListItem,
} from '@/features/alerts/alerts.actions';
import {
  approveManagerAssignmentRequest,
  listManagerAssignmentRequests,
  rejectManagerAssignmentRequest,
} from '@/features/managerAssignments/managerAssignments.actions';
import {
  listLeaseTerminationRequests,
  listUnitConnectionRequests,
  rejectUnitConnectionRequest,
} from '@/features/leases/leases.actions';

type ManagerRequestRow = {
  requestId: string;
  propertyName: string;
  managerName: string;
  managerPhone: string | null;
};

type UnitRequestRow = {
  requestId: string;
  propertyName: string;
  unitCode: string;
  tenantName: string;
  tenantPhone: string | null;
};

type TerminationRow = {
  leaseId: string;
  propertyName: string;
  unitCode: string;
  tenantName: string;
};

const APPROVE_BASE: Record<string, string> = {
  OWNER: '/owner/requests',
  MANAGER: '/manager/requests',
  ADMIN: '/manager/requests',
};

const FINANCE_BASE: Record<string, string> = {
  OWNER: '/owner/finance',
  MANAGER: '/manager/finance',
  ADMIN: '/manager/finance',
};

function timeAgo(iso: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NotificationBell({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertListItem[]>([]);
  const [managerRequests, setManagerRequests] = useState<ManagerRequestRow[]>([]);
  const [unitRequests, setUnitRequests] = useState<UnitRequestRow[]>([]);
  const [terminations, setTerminations] = useState<TerminationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const approveBase = APPROVE_BASE[role];
  const canSeeRequests = role === 'OWNER' || role === 'MANAGER' || role === 'ADMIN';

  const totalPending = managerRequests.length + unitRequests.length + terminations.length;
  const badge = unreadCount + totalPending;

  const refresh = useCallback(async () => {
    setLoading(true);
    const [alertsRes, countRes] = await Promise.all([
      listMyAlerts({ status: 'OPEN' }),
      getUnreadAlertCount(),
    ]);
    if (alertsRes.success && alertsRes.data) setAlerts(alertsRes.data);
    if (countRes.success && countRes.data) setUnreadCount(countRes.data.count);

    if (canSeeRequests) {
      const [unitRes, terminationRes, managerRes] = await Promise.all([
        listUnitConnectionRequests(),
        listLeaseTerminationRequests(),
        role === 'OWNER' || role === 'ADMIN'
          ? listManagerAssignmentRequests()
          : Promise.resolve({ success: true as const, data: [] }),
      ]);
      setManagerRequests(
        managerRes.success && managerRes.data
          ? managerRes.data.map((r) => ({
              requestId: r.requestId,
              propertyName: r.propertyName,
              managerName: r.managerName,
              managerPhone: r.managerPhone,
            }))
          : []
      );
      setUnitRequests(
        unitRes.success && unitRes.data
          ? unitRes.data.map((r) => ({
              requestId: r.requestId,
              propertyName: r.propertyName,
              unitCode: r.unitCode,
              tenantName: r.tenantName,
              tenantPhone: r.tenantPhone,
            }))
          : []
      );
      setTerminations(
        terminationRes.success && terminationRes.data
          ? terminationRes.data.map((r) => ({
              leaseId: r.leaseId,
              propertyName: r.propertyName,
              unitCode: r.unitCode,
              tenantName: r.tenantName,
            }))
          : []
      );
    }
    setLoading(false);
  }, [canSeeRequests, role]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void refresh();
  };

  const handleMarkRead = async (alertRecipientId: string) => {
    const res = await markAlertRead({ alertRecipientId });
    if (res.success) void refresh();
  };

  const handleMarkAllRead = async () => {
    const res = await markAllAlertsRead();
    if (res.success) void refresh();
  };

  const handleApproveManager = async (requestId: string) => {
    const res = await approveManagerAssignmentRequest({ requestId });
    if (res.success) void refresh();
  };

  const handleRejectManager = async (requestId: string) => {
    const res = await rejectManagerAssignmentRequest({ requestId });
    if (res.success) void refresh();
  };

  const handleRejectUnit = async (requestId: string) => {
    const res = await rejectUnitConnectionRequest({ requestId });
    if (res.success) void refresh();
  };

  const hasAnything = alerts.length > 0 || totalPending > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Thông báo"
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-brand-muted transition-colors hover:bg-brand-soft hover:text-brand-ink"
        onClick={handleToggle}
        title="Thông báo"
        type="button"
      >
        <Bell className="h-5 w-5" />
        {badge > 0 ? (
          <span className="pointer-events-none absolute -right-1.5 -top-1.5 inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-[#F8F5EE] shadow-md">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[1400px] max-w-[calc(100vw_-_22rem)] rounded-2xl border border-brand-border/60 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-brand-border/60 px-6 py-4">
            <div>
              <p className="font-headline text-xl font-bold text-brand-ink">Trung tâm thông báo</p>
              <p className="mt-0.5 text-xs text-brand-muted">
                {unreadCount} chưa đọc · {totalPending} yêu cầu chờ xử lý
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                className="text-xs font-semibold text-brand-primary hover:text-brand-primary-deep"
                onClick={() => void handleMarkAllRead()}
                type="button"
              >
                Đánh dấu đã đọc tất cả
              </button>
            ) : null}
          </div>

          <div className="max-h-[calc(100vh_-_14rem)] overflow-y-auto">
            {canSeeRequests && managerRequests.length > 0 ? (
              <div className="border-b border-brand-border/40 px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Yêu cầu phân công quản lý ({managerRequests.length})
                </p>
                <div className="mt-3 space-y-2">
                  {managerRequests.map((req) => (
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-brand-soft/60 p-4" key={req.requestId}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-ink">{req.propertyName}</p>
                        <p className="mt-0.5 truncate text-xs text-brand-muted">
                          {req.managerName}
                          {req.managerPhone ? ` · ${req.managerPhone}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-primary-deep"
                          onClick={() => void handleApproveManager(req.requestId)}
                          type="button"
                        >
                          <Check className="h-3 w-3" />
                          Chấp nhận
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink ring-1 ring-brand-border hover:bg-brand-soft"
                          onClick={() => void handleRejectManager(req.requestId)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {canSeeRequests && unitRequests.length > 0 ? (
              <div className="border-b border-brand-border/40 px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Yêu cầu kết nối căn hộ ({unitRequests.length})
                </p>
                <div className="mt-3 space-y-2">
                  {unitRequests.map((req) => (
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-brand-soft/60 p-4" key={req.requestId}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-ink">
                          {req.propertyName} · Căn {req.unitCode}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-brand-muted">
                          {req.tenantName}
                          {req.tenantPhone ? ` · ${req.tenantPhone}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Link
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-primary-deep"
                          href={`${approveBase}/${req.requestId}/lease`}
                          onClick={() => setOpen(false)}
                        >
                          <FileText className="h-3 w-3" />
                          Tạo hợp đồng
                        </Link>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink ring-1 ring-brand-border hover:bg-brand-soft"
                          onClick={() => void handleRejectUnit(req.requestId)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {canSeeRequests && terminations.length > 0 ? (
              <div className="border-b border-brand-border/40 px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Yêu cầu kết thúc hợp đồng ({terminations.length})
                </p>
                <div className="mt-3 space-y-2">
                  {terminations.map((req) => (
                    <Link
                      className="flex items-center justify-between gap-4 rounded-xl bg-brand-soft/60 p-4 transition-colors hover:bg-brand-soft"
                      href={approveBase}
                      key={req.leaseId}
                      onClick={() => setOpen(false)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-ink">
                          {req.propertyName} · Căn {req.unitCode}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-brand-muted">{req.tenantName}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-brand-primary">Xem chi tiết →</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {alerts.length > 0 ? (
              <div className="px-6 py-2">
                <p className="py-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Thông báo hệ thống
                </p>
                {alerts.map((alert) => {
                  const isPendingPayment = alert.alertType === 'PENDING_PAYMENT_REVIEW';
                  const isVerifiedPayment = alert.alertType === 'PAYMENT_VERIFIED';
                  const financeHref = FINANCE_BASE[role];
                  const itemClass = cn(
                    'flex w-full flex-col items-start gap-1 rounded-xl px-3 py-3 text-left transition-colors hover:bg-brand-soft/40',
                    !alert.isRead && !isVerifiedPayment && 'bg-amber-50/60',
                    isVerifiedPayment && 'bg-emerald-50/60'
                  );
                  const titleNode = (
                    <div className="flex w-full items-start justify-between gap-3">
                      <p
                        className={cn(
                          'flex items-center gap-2 text-sm text-brand-ink',
                          !alert.isRead ? 'font-semibold' : 'font-normal'
                        )}
                      >
                        {isVerifiedPayment ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : null}
                        {alert.title}
                      </p>
                      {!alert.isRead ? (
                        <span
                          className={cn(
                            'mt-1 h-2 w-2 shrink-0 rounded-full',
                            isVerifiedPayment ? 'bg-emerald-500' : 'bg-brand-primary'
                          )}
                        />
                      ) : null}
                    </div>
                  );
                  const bodyNode = (
                    <>
                      {alert.description ? (
                        <p className="text-xs leading-5 text-brand-muted">{alert.description}</p>
                      ) : null}
                      <p className="text-[11px] text-brand-muted/80">{timeAgo(alert.createdAt)}</p>
                      {isPendingPayment ? (
                        <p className="mt-1 text-[11px] font-semibold text-brand-primary">
                          Xem & duyệt thanh toán →
                        </p>
                      ) : null}
                    </>
                  );

                  if (isPendingPayment && financeHref) {
                    return (
                      <Link
                        className={itemClass}
                        href={financeHref}
                        key={alert.alertRecipientId}
                        onClick={() => {
                          void handleMarkRead(alert.alertRecipientId);
                          setOpen(false);
                        }}
                      >
                        {titleNode}
                        {bodyNode}
                      </Link>
                    );
                  }

                  return (
                    <button
                      className={itemClass}
                      key={alert.alertRecipientId}
                      onClick={() => void handleMarkRead(alert.alertRecipientId)}
                      type="button"
                    >
                      {titleNode}
                      {bodyNode}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!hasAnything ? (
              <div className="px-6 py-16 text-center text-sm text-brand-muted">
                {loading ? 'Đang tải...' : 'Chưa có thông báo hay yêu cầu nào.'}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
