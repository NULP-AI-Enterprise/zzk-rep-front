'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Doctor = { id: number; first_name: string; last_name: string };
type Status = 'PENDING' | 'ATTACHED' | 'DETACHED';

export default function StatusAction({
  patientId,
  currentStatus = 'PENDING',
}: {
  patientId: number;
  currentStatus?: Status;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newStatus, setNewStatus] = useState<'ATTACHED' | 'DETACHED'>(
    currentStatus === 'ATTACHED' ? 'DETACHED' : 'ATTACHED'
  );
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/admin/users')
      .then(r => r.json())
      .then((users: { id: number; role: string; first_name: string; last_name: string }[]) => {
        setDoctors(Array.isArray(users) ? users.filter(u => u.role === 'DOCTOR') : []);
      })
      .catch(() => {});
  }, [open]);

  const handleSubmit = async () => {
    if (newStatus === 'ATTACHED' && !doctorId) {
      setError('Оберіть лікаря');
      return;
    }
    setLoading(true);
    setError('');

    const body: { status: string; doctor_id?: number } = { status: newStatus };
    if (newStatus === 'ATTACHED') body.doctor_id = Number(doctorId);

    const res = await fetch(`/api/patients/${patientId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail ?? data?.error ?? 'Помилка');
      setLoading(false);
    }
  };

  if (!open) {
    const label =
      currentStatus === 'PENDING'
        ? 'Підтвердити'
        : currentStatus === 'ATTACHED'
        ? 'Відкріпити'
        : 'Прикріпити';
    const cls =
      currentStatus === 'PENDING'
        ? 'bg-brand text-white hover:bg-brand-light'
        : currentStatus === 'ATTACHED'
        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';

    return (
      <button
        onClick={() => {
          setNewStatus(currentStatus === 'ATTACHED' ? 'DETACHED' : 'ATTACHED');
          setOpen(true);
        }}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${cls}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      <select
        value={newStatus}
        onChange={e => setNewStatus(e.target.value as 'ATTACHED' | 'DETACHED')}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand"
      >
        <option value="ATTACHED">Прикріпити (ATTACHED)</option>
        <option value="DETACHED">Відхилити (DETACHED)</option>
      </select>

      {newStatus === 'ATTACHED' && (
        <select
          value={doctorId}
          onChange={e => setDoctorId(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand"
        >
          <option value="">— Оберіть лікаря —</option>
          {doctors.map(d => (
            <option key={d.id} value={d.id}>
              {d.last_name} {d.first_name}
            </option>
          ))}
        </select>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex gap-1.5">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Зберегти'}
        </button>
        <button
          onClick={() => { setOpen(false); setError(''); }}
          className="px-2 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
