'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/auth/confirm-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => {
        if (res.ok) setStatus('success');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center space-y-4">
      {status === 'verifying' && (
        <div className="animate-pulse text-gray-600">Перевірка токену...</div>
      )}
      {status === 'success' && (
        <>
          <div className="text-4xl">✓</div>
          <h1 className="text-xl font-bold text-gray-800">Email успішно змінено</h1>
          <p className="text-sm text-gray-500">
            Тепер ви можете увійти, використовуючи новий email.
          </p>
          <a href="/login" className="inline-block mt-4 px-6 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
            Увійти
          </a>
        </>
      )}
      {status === 'error' && (
        <div className="text-red-500">
          Помилка підтвердження. Посилання недійсне або протерміноване.
        </div>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
