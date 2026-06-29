'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Region = { id: number; name: string };

const ROLES = [
  { value: 'DOCTOR',    label: 'Лікар'     },
  { value: 'MODERATOR', label: 'Модератор' },
  { value: 'ADMIN',     label: 'Адмін'     },
];

export default function NewUserPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    email: '', role: 'DOCTOR', first_name: '', last_name: '',
    patronymic: '', region_id: '', job_position: '', job_place: '',
  });

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(setRegions).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const payload: Record<string, unknown> = {
      email: form.email,
      role: form.role,
      first_name: form.first_name,
      last_name: form.last_name,
    };
    if (form.patronymic)   payload.patronymic   = form.patronymic;
    if (form.region_id)    payload.region_id    = Number(form.region_id);
    if (form.job_position) payload.job_position = form.job_position;
    if (form.job_place)    payload.job_place    = form.job_place;

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/admin/users');
    } else {
      const body = await res.json().catch(() => ({}));
      setErrorMsg(body?.detail ?? body?.error ?? 'Помилка при створенні');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Новий користувач</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Прізвище *">
            <input required value={form.last_name} onChange={e => set('last_name', e.target.value)}
              className={inputCls} placeholder="Іваненко" />
          </Field>
          <Field label="Ім'я *">
            <input required value={form.first_name} onChange={e => set('first_name', e.target.value)}
              className={inputCls} placeholder="Іван" />
          </Field>
        </div>

        <Field label="По батькові">
          <input value={form.patronymic} onChange={e => set('patronymic', e.target.value)}
            className={inputCls} placeholder="Іванович" />
        </Field>

        <Field label="Email *">
          <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
            className={inputCls} placeholder="doctor@hospital.ua" />
        </Field>

        <Field label="Роль *">
          <select required value={form.role} onChange={e => set('role', e.target.value)} className={inputCls}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>

        <Field label="Регіон">
          <select value={form.region_id} onChange={e => set('region_id', e.target.value)} className={inputCls}>
            <option value="">— не вказано —</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Посада">
            <input value={form.job_position} onChange={e => set('job_position', e.target.value)}
              className={inputCls} placeholder="Гастроентеролог" />
          </Field>
          <Field label="Місце роботи">
            <input value={form.job_place} onChange={e => set('job_place', e.target.value)}
              className={inputCls} placeholder="КНП «...»" />
          </Field>
        </div>

        {status === 'error' && (
          <p className="text-red-600 text-sm">{errorMsg}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={status === 'loading'}
            className="flex-1 bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
            {status === 'loading' ? 'Збереження...' : 'Створити'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full border-b border-black/30 bg-transparent py-2 outline-none focus:border-brand transition-colors text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
