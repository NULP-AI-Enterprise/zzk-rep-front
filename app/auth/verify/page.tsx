'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        if (res.ok) {
          const { role } = await res.json();
          if (role === 'ADMIN')         router.push('/admin');
          else if (role === 'DOCTOR')    router.push('/doctor');
          else if (role === 'MODERATOR') router.push('/moderator');
          else                           router.push('/patient');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [searchParams, router]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center">
      {status === 'verifying' ? (
        <div className="animate-pulse text-gray-600">Перевірка токену...</div>
      ) : (
        <div className="text-red-500">
          Помилка верифікації. Посилання недійсне або протерміноване.
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense
        fallback={
          <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center animate-pulse text-gray-600">
            Завантаження...
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
