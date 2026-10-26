'use client';

import { formatDetail } from '@/lib/format';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Doctor = { id: number; first_name: string; last_name: string };
type Status = 'PENDING' | 'ATTACHED' | 'DETACHED';

export default function StatusAction({
  patientId,
  currentStatus = 'PENDING',
  suggestedDoctorId,
  selfAttach = false,
}: {
  patientId: number;
  currentStatus?: Status;
  suggestedDoctorId?: number;
  /** Лікар прикріплює себе — не показувати вибір лікаря, doctor_id не надсилати */
  selfAttach?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newStatus, setNewStatus] = useState<'ATTACHED' | 'DETACHED'>(
    currentStatus === 'ATTACHED' ? 'DETACHED' : 'ATTACHED',
  );
  const [doctorId, setDoctorId] = useState(
    suggestedDoctorId ? String(suggestedDoctorId) : '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    // a doctor attaching a patient to themselves needs no doctor list (and may not read it)
    if (!open || selfAttach) return;
    fetch('/api/doctors')
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error ?? 'Не вдалося завантажити лікарів');
        return r.json();
      })
      .then((docs: Doctor[]) => {
        // Put suggested doctor first
        if (suggestedDoctorId) {
          const idx = docs.findIndex(d => d.id === suggestedDoctorId);
          if (idx > 0) docs.unshift(docs.splice(idx, 1)[0]);
        }
        setDoctors(docs);
        if (suggestedDoctorId && !doctorId) setDoctorId(String(suggestedDoctorId));
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Не вдалося завантажити лікарів'));
  }, [open]);

  const handleSubmit = async () => {
    if (newStatus === 'ATTACHED' && !selfAttach && !doctorId) {
      setError('Оберіть лікаря');
      return;
    }
    setLoading(true);
    setError('');

    const body: { status: string; doctor_id?: number } = { status: newStatus };
    if (newStatus === 'ATTACHED' && !selfAttach) body.doctor_id = Number(doctorId);

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
      setError(formatDetail(data?.detail ?? data?.error, 'Помилка'));
      setLoading(false);
    }
  };

  if (!open) {
    const label =
      currentStatus === 'PENDING'   ? 'Підтвердити' :
      currentStatus === 'ATTACHED'  ? 'Відкріпити'  : 'Прикріпити';
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
    <div className="flex flex-col gap-2 min-w-[230px]">
      <select
        value={newStatus}
        onChange={e => setNewStatus(e.target.value as 'ATTACHED' | 'DETACHED')}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand"
      >
        <option value="ATTACHED">Прикріпити (Активний)</option>
        <option value="DETACHED">Відкріпити (Відкріплений)</option>
      </select>

      {newStatus === 'ATTACHED' && !selfAttach && (
        <select
          value={doctorId}
          onChange={e => setDoctorId(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand"
        >
          <option value="">— Оберіть лікаря —</option>
          {doctors.map(d => (
            <option key={d.id} value={d.id}>
              {d.last_name} {d.first_name}
              {d.id === suggestedDoctorId ? ' ★' : ''}
            </option>
          ))}
        </select>
      )}
      {newStatus === 'ATTACHED' && selfAttach && (
        <p className="text-xs text-gray-500 italic">Пацієнта буде прикріплено до вас</p>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex gap-1.5">
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50">
          {loading ? '...' : 'Зберегти'}
        </button>
        <button onClick={() => { setOpen(false); setError(''); }}
          className="px-2 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}
