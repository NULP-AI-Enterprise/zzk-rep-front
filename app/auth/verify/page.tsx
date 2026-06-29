'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          const { role } = await res.json();
          // Redirect based on role
          if (role === 'ADMIN') router.push('/admin');
          else if (role === 'DOCTOR') router.push('/doctor');
          else if (role === 'MODERATOR') router.push('/moderator');
          else router.push('/patient');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center">
        {status === 'verifying' ? (
          <div className="animate-pulse">Перевірка токену...</div>
        ) : (
          <div className="text-red-500">Помилка верифікації. Посилання недійсне або протерміноване.</div>
        )}
      </div>
    </div>
  );
}
