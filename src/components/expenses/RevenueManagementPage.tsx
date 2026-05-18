'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { getProperties } from '@/features/properties/properties.actions';
import {
  createExpense,
  getRevenueAnalytics,
  listExpenses,
  updateExpense,
  voidExpense,
  type ExpenseListItem,
  type RevenueAnalytics,
} from '@/features/expenses/expenses.actions';
import { expenseCategories, type ExpenseCategory } from '@/features/expenses/expenses.validation';
import Drawer from '@/components/ui/Drawer';

type PropertyOption = {
  id: string;
  propertyName: string;
};

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function money(value: string) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

function categoryText(category: string) {
  const labels: Record<string, string> = {
    MAINTENANCE: 'Bảo trì',
    REPAIR: 'Sửa chữa',
    UTILITY: 'Tiện ích',
    CLEANING: 'Vệ sinh',
    MANAGEMENT: 'Quản lý',
    TAX: 'Thuế',
    INSURANCE: 'Bảo hiểm',
    MARKETING: 'Quảng bá',
    SUPPLIES: 'Vật tư',
    OTHER: 'Khác',
  };
  return labels[category] ?? category;
}

const emptyForm = {
  propertyId: '',
  unitId: '',
  category: 'MAINTENANCE' as ExpenseCategory,
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  vendorName: '',
  note: '',
  receiptUrl: '',
};

export default function RevenueManagementPage({ roleBase: _roleBase }: { roleBase: 'owner' | 'manager' }) {
  void _roleBase;
  const initialMonth = useMemo(() => currentMonth(), []);
  const [billingYear, setBillingYear] = useState(String(initialMonth.year));
  const [billingMonth, setBillingMonth] = useState(String(initialMonth.month));
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const [propertyResponse, analyticsResponse, expenseResponse] = await Promise.all([
      getProperties(),
      getRevenueAnalytics({
        billingYear: Number(billingYear),
        billingMonth: Number(billingMonth),
        propertyId,
        status: 'ACTIVE',
      }),
      listExpenses({
        billingYear: Number(billingYear),
        billingMonth: Number(billingMonth),
        propertyId,
        status: 'ALL',
      }),
    ]);

    if (propertyResponse.success && propertyResponse.data) {
      const mapped = propertyResponse.data.map((property) => ({
        id: property.id,
        propertyName: property.propertyName,
      }));
      setProperties(mapped);
      setForm((current) => ({
        ...current,
        propertyId: current.propertyId || propertyId || mapped[0]?.id || '',
      }));
    }

    if (analyticsResponse.success && analyticsResponse.data) {
      setAnalytics(analyticsResponse.data);
    } else {
      setError(analyticsResponse.message || 'Không thể tải báo cáo doanh thu');
    }

    if (expenseResponse.success && expenseResponse.data) {
      setExpenses(expenseResponse.data);
    }

    setLoading(false);
  }, [billingMonth, billingYear, propertyId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const handleRefresh = async () => {
    setBusy('refresh');
    await load();
    setBusy('');
  };

  const handleSubmitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(editingExpenseId ? 'update' : 'create');
    setError('');
    setMessage('');

    const payload = {
      ...form,
      amount: Number(form.amount),
    };
    const response = editingExpenseId
      ? await updateExpense({ ...payload, expenseId: editingExpenseId })
      : await createExpense(payload);

    if (response.success) {
      setMessage(editingExpenseId ? 'Đã cập nhật chi phí' : 'Đã ghi nhận chi phí');
      setForm((current) => ({ ...emptyForm, propertyId: current.propertyId }));
      setEditingExpenseId('');
      setExpenseDrawerOpen(false);
      await load();
    } else {
      setError(response.message || 'Không thể lưu chi phí');
    }

    setBusy('');
  };

  const handleEditExpense = (expense: ExpenseListItem) => {
    setEditingExpenseId(expense.expenseId);
    setForm({
      propertyId: expense.propertyId,
      unitId: expense.unitId ?? '',
      category: expense.category as ExpenseCategory,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      vendorName: expense.vendorName ?? '',
      note: expense.note ?? '',
      receiptUrl: expense.receiptUrl ?? '',
    });
    setMessage('');
    setError('');
    setExpenseDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setExpenseDrawerOpen(false);
    setEditingExpenseId('');
    setForm((current) => ({ ...emptyForm, propertyId: current.propertyId }));
  };

  const handleOpenCreate = () => {
    setEditingExpenseId('');
    setForm((current) => ({ ...emptyForm, propertyId: current.propertyId || properties[0]?.id || '' }));
    setExpenseDrawerOpen(true);
  };

  const handleVoidExpense = async (expense: ExpenseListItem) => {
    const confirmed = window.confirm(`Hủy chi phí ${money(expense.amount)} cho ${expense.propertyName}?`);
    if (!confirmed) return;

    setBusy(`void-${expense.expenseId}`);
    setError('');
    const response = await voidExpense({ expenseId: expense.expenseId });
    if (response.success) {
      setMessage('Đã hủy chi phí khỏi báo cáo mặc định');
      await load();
    } else {
      setError(response.message || 'Không thể hủy chi phí');
    }
    setBusy('');
  };

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
      {loading ? <p className="text-sm text-brand-muted">Đang tải báo cáo...</p> : null}

      <section className="shell-card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline text-xl font-bold text-brand-ink">Chi phí</h2>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary px-4 py-2.5 text-sm" onClick={handleOpenCreate} type="button">
              <Plus className="h-4 w-4" />
              Thêm chi phí
            </button>
            <button className="btn-secondary px-4 py-2.5 text-sm" disabled={busy === 'refresh'} onClick={handleRefresh} type="button">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Năm</span>
            <input className="input-shell" onChange={(event) => setBillingYear(event.target.value)} type="number" value={billingYear} />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Tháng</span>
            <input className="input-shell" max={12} min={1} onChange={(event) => setBillingMonth(event.target.value)} type="number" value={billingMonth} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Tài sản</span>
            <select className="input-shell" onChange={(event) => setPropertyId(event.target.value)} value={propertyId}>
              <option value="">Tất cả tài sản</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.propertyName}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {analytics ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="shell-card p-6">
            <h2 className="font-headline text-xl font-bold text-brand-ink">Hiệu quả theo tài sản</h2>
            <div className="mt-4 space-y-3">
              {analytics.byProperty.length > 0 ? analytics.byProperty.map((property) => (
                <div className="shell-muted p-4" key={property.propertyId}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-brand-ink">{property.propertyName}</p>
                      <p className="mt-2 text-sm text-brand-muted">Đã thu {money(property.paid)} · Chi phí {money(property.expenses)}</p>
                    </div>
                    <p className="font-headline text-2xl font-extrabold text-brand-ink">{money(property.net)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-brand-muted">Chưa có dữ liệu cho bộ lọc này.</p>}
            </div>
          </div>

          <div className="shell-card p-6">
            <h2 className="font-headline text-xl font-bold text-brand-ink">Chi phí theo nhóm</h2>
            <div className="mt-4 space-y-3">
              {analytics.byCategory.length > 0 ? analytics.byCategory.map((category) => (
                <div className="shell-muted flex items-center justify-between gap-3 p-4" key={category.category}>
                  <span className="font-semibold text-brand-ink">{categoryText(category.category)}</span>
                  <span className="text-sm font-semibold text-brand-muted">{money(category.totalAmount)}</span>
                </div>
              )) : <p className="text-sm text-brand-muted">Chưa phát sinh chi phí trong tháng này.</p>}
            </div>
          </div>
        </section>
      ) : null}

      <section className="shell-card p-6">
        <h2 className="font-headline text-xl font-bold text-brand-ink">Lịch sử chi phí</h2>
        <div className="mt-4 space-y-3">
          {expenses.length > 0 ? expenses.map((expense) => (
            <div className="shell-muted p-4" key={expense.expenseId}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-brand-ink">{categoryText(expense.category)} · {expense.propertyName}</p>
                  <p className="mt-2 text-sm text-brand-muted">
                    {new Date(expense.expenseDate).toLocaleDateString('vi-VN')} · {expense.vendorName || 'Không có nhà cung cấp'} · {expense.status === 'VOIDED' ? 'Đã hủy' : 'Đang ghi nhận'}
                  </p>
                  {expense.note ? <p className="mt-2 text-sm text-brand-muted">{expense.note}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="font-headline text-2xl font-extrabold text-brand-ink">{money(expense.amount)}</p>
                  {expense.canEdit ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      <button className="btn-secondary px-3 py-2 text-xs" onClick={() => handleEditExpense(expense)} type="button">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button className="btn-secondary px-3 py-2 text-xs" disabled={busy === `void-${expense.expenseId}`} onClick={() => void handleVoidExpense(expense)} type="button">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )) : <p className="text-sm text-brand-muted">Chưa có khoản chi phí nào theo bộ lọc hiện tại.</p>}
        </div>
      </section>

      <Drawer onClose={handleCloseDrawer} open={expenseDrawerOpen} title={editingExpenseId ? 'Chỉnh sửa chi phí' : 'Thêm chi phí mới'}>
        <form className="space-y-4" onSubmit={handleSubmitExpense}>
          <select aria-label="Chọn tài sản" className="input-shell" onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))} required title="Chọn tài sản" value={form.propertyId}>
            <option value="">Chọn tài sản</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.propertyName}</option>
            ))}
          </select>
          <select aria-label="Chọn nhóm chi phí" className="input-shell" onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))} title="Chọn nhóm chi phí" value={form.category}>
            {expenseCategories.map((category) => (
              <option key={category} value={category}>{categoryText(category)}</option>
            ))}
          </select>
          <input className="input-shell" min="0" onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Số tiền (VNĐ)" required type="number" value={form.amount} />
          <input aria-label="Ngày chi phí" className="input-shell" onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} required title="Ngày chi phí" type="date" value={form.expenseDate} />
          <input className="input-shell" onChange={(event) => setForm((current) => ({ ...current, vendorName: event.target.value }))} placeholder="Nhà cung cấp" value={form.vendorName} />
          <input className="input-shell" onChange={(event) => setForm((current) => ({ ...current, receiptUrl: event.target.value }))} placeholder="Link hóa đơn/chứng từ nếu có" value={form.receiptUrl} />
          <textarea className="input-shell min-h-28" onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ghi chú nội dung chi phí" value={form.note} />
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary px-5 py-3 text-sm" disabled={busy === 'create' || busy === 'update'} type="submit">
              <Plus className="h-4 w-4" />
              <span>{busy === 'create' || busy === 'update' ? 'Đang lưu...' : editingExpenseId ? 'Cập nhật chi phí' : 'Lưu chi phí'}</span>
            </button>
            <button className="btn-secondary px-5 py-3 text-sm" onClick={handleCloseDrawer} type="button">
              <X className="h-4 w-4" />
              <span>Hủy</span>
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
