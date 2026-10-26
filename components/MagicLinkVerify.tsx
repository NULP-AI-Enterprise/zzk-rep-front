'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * One-time link landing. The token is consumed only after an explicit click:
 * mail-security scanners (Defender Safe Links, etc.) open links and run JS, which would
 * otherwise burn the single-use token before the person ever sees it.
 */
export default function MagicLinkVerify({
  token,
  title,
  description,
  next,
}: {
  token: string | null;
  title: string;
  description: string;
  /** Where to go after login instead of the role's home page (must be an internal path) */
  next?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>(token ? 'idle' : 'error');
  const [retryable, setRetryable] = useState(false);
  const [error, setError] = useState(token ? '' : 'Посилання не містить токену. Запросіть нове на сторінці входу.');

  const handleConfirm = async () => {
    if (!token || status === 'loading') return;
    setStatus('loading');
    setError('');
    setRetryable(false);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? 'Помилка верифікації. Посилання недійсне або протерміноване.');
        setRetryable(false);
        setStatus('error');
        return;
      }
      const target = next && next.startsWith('/') && !next.startsWith('//') && body.role === 'PATIENT'
        ? next
        : (body.home ?? '/');
      router.replace(target);
    } catch {
      setError('Мережева помилка. Перевірте з\'єднання та спробуйте ще раз.');
      setRetryable(true);
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center space-y-5">
      {status === 'error' ? (
        <>
          <p className="text-red-600 text-sm" role="alert">{error}</p>
          {token && retryable && (
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors"
            >
              Спробувати ще раз
            </button>
          )}
          <Link href="/login" className="inline-block text-brand text-sm font-medium hover:underline">
            Отримати нове посилання для входу
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === 'loading'}
            className="w-full bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors active:scale-95 disabled:opacity-50"
          >
            {status === 'loading' ? 'Вхід...' : 'Увійти'}
          </button>
        </>
      )}
    </div>
  );
}
