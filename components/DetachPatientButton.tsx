'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DetachPatientButton({ patientId }: { patientId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetach = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DETACHED' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? 'Помилка відкріплення');
      }
      router.push('/doctor');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка відкріплення');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
      <h2 className="text-lg font-bold mb-4">Дії з пацієнтом</h2>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          Відкріпити пацієнта
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Ви впевнені? Пацієнт буде відкріплений від вас.
          </p>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDetach}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Зачекайте…' : 'Так, відкріпити'}
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); setError(null); }}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
