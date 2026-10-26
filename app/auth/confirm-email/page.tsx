'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// The token is consumed only on an explicit click, so mail scanners that open links cannot burn it.
function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(token ? 'idle' : 'error');
  const [error, setError] = useState(token ? '' : 'Посилання не містить токену.');

  const handleConfirm = async () => {
    if (!token || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const body = await res.json().catch(() => ({}));
        setError(typeof body?.error === 'string' ? body.error : 'Посилання недійсне або протерміноване.');
        setStatus('error');
      }
    } catch {
      setError('Мережева помилка. Спробуйте ще раз.');
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center space-y-4">
      {(status === 'idle' || status === 'loading') && (
        <>
          <h1 className="text-xl font-bold text-gray-800">Підтвердження email</h1>
          <p className="text-sm text-gray-500">Натисніть кнопку, щоб підтвердити зміну email.</p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === 'loading'}
            className="w-full bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Підтвердження...' : 'Підтвердити'}
          </button>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-4xl">✓</div>
          <h1 className="text-xl font-bold text-gray-800">Email успішно змінено</h1>
          <p className="text-sm text-gray-500">Тепер ви можете увійти, використовуючи новий email.</p>
          <Link href="/login" className="inline-block mt-4 px-6 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
            Увійти
          </Link>
        </>
      )}
      {status === 'error' && (
        <p className="text-red-500 text-sm" role="alert">Помилка підтвердження. {error}</p>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense
        fallback={
          <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center animate-pulse text-gray-600">
            Завантаження...
          </div>
        }
      >
        <ConfirmEmailContent />
      </Suspense>
    </div>
  );
}
