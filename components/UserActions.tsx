'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Region = { id: number; name: string };
type User = {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  region: { id: number; name: string } | null;
  job_position: string | null;
  job_place: string | null;
};

const ROLES = [
  { value: 'DOCTOR',    label: 'Лікар'     },
  { value: 'MODERATOR', label: 'Модератор' },
  { value: 'ADMIN',     label: 'Адмін'     },
];

const inputCls = 'w-full border-b border-black/30 bg-transparent py-1.5 outline-none focus:border-brand transition-colors text-sm';

export default function UserActions({ user }: { user: User }) {
  const router = useRouter();
  const [mode, setMode]         = useState<'idle' | 'edit' | 'confirmDelete'>('idle');
  const [regions, setRegions]   = useState<Region[]>([]);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  const [form, setForm] = useState({
    first_name:   user.first_name,
    last_name:    user.last_name,
    patronymic:   user.patronymic  ?? '',
    role:         user.role,
    region_id:    user.region?.id ? String(user.region.id) : '',
    job_position: user.job_position ?? '',
    job_place:    user.job_place    ?? '',
  });

  useEffect(() => {
    if (mode !== 'edit') return;
    fetch('/api/regions').then(r => r.json()).then(setRegions).catch(() => {});
  }, [mode]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload: Record<string, unknown> = {
      first_name: form.first_name,
      last_name:  form.last_name,
      role:       form.role,
    };
    if (form.patronymic)   payload.patronymic   = form.patronymic;
    if (form.region_id)    payload.region_id    = Number(form.region_id);
    if (form.job_position) payload.job_position = form.job_position;
    if (form.job_place)    payload.job_place    = form.job_place;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMode('idle');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail ?? data?.error ?? 'Помилка збереження');
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail ?? data?.error ?? 'Помилка видалення');
      setDeleting(false);
      setMode('idle');
    }
  }

  // ── Delete confirmation ───────────────────────────────────────────────────
  if (mode === 'confirmDelete') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-red-600 font-medium">Видалити?</span>
        <button onClick={handleDelete} disabled={deleting}
          className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
          {deleting ? '...' : 'Так'}
        </button>
        <button onClick={() => setMode('idle')}
          className="px-2.5 py-1 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          Ні
        </button>
        {error && <p className="text-red-500 text-xs w-full">{error}</p>}
      </div>
    );
  }

  // ── Edit modal (inline overlay) ───────────────────────────────────────────
  if (mode === 'edit') {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMode('idle')} />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Редагувати користувача</h2>
              <button type="button" onClick={() => setMode('idle')}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Прізвище *">
                <input required value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Ім'я *">
                <input required value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inputCls} />
              </Field>
            </div>

            <Field label="По батькові">
              <input value={form.patronymic} onChange={e => set('patronymic', e.target.value)} className={inputCls} />
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
                <input value={form.job_position} onChange={e => set('job_position', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Місце роботи">
                <input value={form.job_place} onChange={e => set('job_place', e.target.value)} className={inputCls} />
              </Field>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand text-white py-2.5 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
              <button type="button" onClick={() => setMode('idle')}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Скасувати
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  // ── Default: action buttons ───────────────────────────────────────────────
  return (
    <div className="flex gap-1.5">
      <button onClick={() => setMode('edit')}
        className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
        Редагувати
      </button>
      <button onClick={() => setMode('confirmDelete')}
        className="px-2.5 py-1 text-xs font-medium border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
        Видалити
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
