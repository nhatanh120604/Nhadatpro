'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, KeyRound, Mail } from 'lucide-react';
import { loginAction } from '@/features/auth/auth.actions';
import { loginSchema, type LoginInput } from '@/features/auth/auth.validation';

type LoginClientPageProps = {
  googleAuthEnabled: boolean;
};

export function LoginClientPage({ googleAuthEnabled }: LoginClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(searchParams.get('error') || '');
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError('');

    const response = await loginAction(data);

    if (response.success && response.data?.redirectTo) {
      router.push(response.data.redirectTo);
      return;
    }

    setError(response.message || 'Không thể đăng nhập lúc này');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_left_top,rgba(245,158,11,0.16),transparent_24rem),linear-gradient(180deg,#fffdfa_0%,#f6efe7_100%)] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-brand-border bg-white/75 shadow-[0_30px_80px_rgba(115,72,0,0.08)] backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[720px] overflow-hidden bg-[linear-gradient(180deg,#f8f3ed_0%,#f2ebe2_100%)] p-12 md:flex md:flex-col md:justify-between">
          <div className="absolute inset-y-0 left-0 w-40 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18),transparent_65%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary-deep to-brand-primary text-white shadow-lg shadow-amber-900/25">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-headline text-2xl font-extrabold text-brand-ink">Nha Dat Pro</p>
                <p className="text-[11px] uppercase tracking-[0.25em] text-brand-muted">Quản lý tài sản chuyên nghiệp</p>
              </div>
            </div>

            <div className="mt-20 max-w-xl">
              <p className="text-balance font-headline text-6xl font-extrabold leading-[0.95] text-brand-ink">
                Quản lý bất động sản <span className="text-brand-primary-deep">chuyên nghiệp</span> và liền mạch.
              </p>
              <p className="mt-8 max-w-lg text-xl leading-9 text-brand-muted">
                Đơn giản hóa vận hành, quản lý hợp đồng, kết nối người thuê và điều phối quản gia trong một nền tảng duy nhất.
              </p>
            </div>
          </div>

          <div className="relative z-10 shell-panel max-w-md p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#424b52] text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-brand-ink">Anh Minh Tuấn</p>
                <p className="text-sm text-brand-muted">Chủ chuỗi căn hộ dịch vụ tại Quận 1</p>
              </div>
            </div>
            <p className="mt-5 text-lg italic leading-8 text-brand-muted">
              “Từ khi dùng Nha Dat Pro, tôi tiết kiệm được rất nhiều thời gian cho việc thu phí, theo dõi hợp đồng và xử lý yêu cầu hằng ngày.”
            </p>
          </div>
        </section>

        <section className="flex min-h-[720px] items-center bg-white/86 px-6 py-10 md:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-primary-deep">Chào mừng trở lại</p>
              <h1 className="font-headline text-4xl font-extrabold text-brand-ink">Đăng nhập hệ thống</h1>
              <p className="text-base leading-7 text-brand-muted">
                Vui lòng đăng nhập để tiếp tục quản lý tài sản, hợp đồng và quy trình vận hành.
              </p>
            </div>

            {error ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-muted" htmlFor="email">
                  Email của bạn
                </label>
                <div className="input-shell flex items-center gap-3 px-4 py-0">
                  <Mail className="h-4 w-4 text-brand-muted" />
                  <input
                    {...register('email')}
                    className="w-full border-0 bg-transparent px-0 py-3.5 outline-none"
                    id="email"
                    placeholder="owner@pmh.com"
                    type="email"
                  />
                </div>
                {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-muted" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="input-shell flex items-center gap-3 px-4 py-0">
                  <KeyRound className="h-4 w-4 text-brand-muted" />
                  <input
                    {...register('password')}
                    className="w-full border-0 bg-transparent px-0 py-3.5 outline-none"
                    id="password"
                    placeholder="Password123!"
                    type="password"
                  />
                </div>
                {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
              </div>

              <button className="btn-primary w-full px-5 py-4 text-base" disabled={loading} type="submit">
                <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-brand-border" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">hoặc</span>
              <div className="h-px flex-1 bg-brand-border" />
            </div>

            {googleAuthEnabled ? (
              <Link className="btn-secondary w-full justify-center px-5 py-4 text-base" href="/auth/google/start">
                <span>Tiếp tục với Google</span>
              </Link>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                Đăng nhập Google chưa được cấu hình trong môi trường hiện tại. Hãy thêm <span className="font-semibold">GOOGLE_CLIENT_ID</span> và{' '}
                <span className="font-semibold">GOOGLE_CLIENT_SECRET</span>, rồi khởi động lại máy chủ phát triển.
              </div>
            )}

            <div className="my-8 grid gap-3 rounded-2xl border border-brand-border bg-brand-soft/65 p-4 text-sm text-brand-muted">
              <p className="font-semibold text-brand-ink">Tài khoản mẫu</p>
              <p>Sau khi seed lại dữ liệu, tất cả tài khoản mẫu dùng mật khẩu <span className="font-semibold text-brand-primary-deep">Password123!</span>.</p>
              <p>Người thuê và quản gia mới có thể tự đăng ký ngay từ trang này.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Link className="btn-primary px-4 py-3 text-sm" href="/register">
                Chọn vai trò để đăng ký
              </Link>
              <Link className="btn-secondary px-4 py-3 text-sm" href="/register/owner">
                Tạo tài khoản chủ sở hữu
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
