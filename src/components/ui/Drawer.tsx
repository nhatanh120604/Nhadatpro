'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'w-[640px]',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0 }}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 ${width} max-w-full overflow-y-auto bg-[#F8F5EE] shadow-2xl`}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0 }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-border/60 bg-[#F8F5EE]/95 px-6 py-4 backdrop-blur">
          <h2 className="font-headline text-2xl font-bold text-brand-ink">{title}</h2>
          <button
            aria-label="Đóng"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-muted hover:bg-white hover:text-brand-ink"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </aside>
    </>
  );
}
