'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    console.log('[login] → POST /api/auth/login', { email });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const body = await res.json().catch(() => null);
      console.log('[login] ← status', res.status, body);

      if (res.ok) {
        console.log('[login] magic link sent successfully');
        setStatus('success');
      } else {
        const msg = body?.error ?? `HTTP ${res.status}`;
        console.error('[login] backend error:', msg);
        setErrorMsg(msg);
        setStatus('error');
      }
    } catch (err) {
      console.error('[login] network/fetch error:', err);
      setErrorMsg('Мережева помилка — перевірте консоль');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Вхід в систему</h1>
          <p className="text-gray-500 mt-2">Введіть email для отримання посилання для входу</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center">
            Посилання для входу надіслано на {email}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш email"
                className="w-full border-b border-black/50 bg-transparent py-2 outline-none focus:border-brand transition-colors"
              />
            </div>
            {status === 'error' && (
              <p className="text-red-600 text-sm text-center">{errorMsg || 'Помилка. Спробуйте ще раз.'}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors active:scale-95 disabled:opacity-50"
            >
              {status === 'loading' ? 'Надсилання...' : 'Отримати посилання'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
