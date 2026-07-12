'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type PatientFields = {
  initials: string;
  sex: string;
  birth_year: number;
  weight: number | null;
  height: number | null;
  disability: string;
  diagnosis: string;
  histologically_confirmed: string;
  diagnosis_year: number | null;
  email: string;
};

const DISABILITIES = [
  { value: 'NONE',    label: 'Відсутня' },
  { value: 'GROUP_1', label: 'I група' },
  { value: 'GROUP_2', label: 'II група' },
  { value: 'GROUP_3', label: 'III група' },
];

const DIAGNOSES = [
  { value: 'UC',           label: 'Виразковий коліт (ВК)' },
  { value: 'CD',           label: 'Хвороба Крона (ХК)' },
  { value: 'UNCLASSIFIED', label: 'ЗЗК-некласифіковане' },
];

export default function PatientEditPanel({
  patientId,
  patient,
  onSaved,
}: {
  patientId: number;
  patient: PatientFields;
  onSaved?: (updated: Partial<PatientFields>) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PatientFields>(patient);
  const [newEmail, setNewEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const set = (field: keyof PatientFields, value: string | number | null) =>
    setForm(f => ({ ...f, [field]: value }));

  // last successfully committed values — used to reset on cancel without going stale after save
  const [committed, setCommitted] = useState<PatientFields>(patient);

  const handleClose = () => {
    setOpen(false);
    setForm(committed);   // reset to last-saved values, not stale prop (fix #2)
    setNewEmail('');
    setEmailSent(false);
    setError(null);
    setEmailError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // fix #1: send nullable fields explicitly; backend uses model_dump(exclude_none=True)
      // so nulls are dropped server-side, which is correct — we can't clear weight/height via
      // PATCH (backend schema design). Only send defined values to avoid spurious 422s.
      const body: Record<string, unknown> = {
        initials: form.initials,
        sex: form.sex,
        birth_year: form.birth_year,
        disability: form.disability,
        diagnosis: form.diagnosis,
        histologically_confirmed: form.histologically_confirmed,
        ...(form.weight != null    && { weight:        form.weight }),
        ...(form.height != null    && { height:        form.height }),
        ...(form.diagnosis_year != null && { diagnosis_year: form.diagnosis_year }),
      };
      const res = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail ?? 'Помилка збереження');
      }
      setCommitted(form);   // fix #2: future close resets to this saved state, not the stale prop
      onSaved?.(form);
      setOpen(false);
      setError(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail) return;
    setEmailSending(true);
    setEmailError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/request-email-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_email: newEmail }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail ?? d?.error ?? 'Помилка');
      }
      setEmailSent(true);
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Помилка надсилання');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-brand hover:underline font-medium"
      >
        Редагувати профіль
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Редагування профілю пацієнта</h2>
              <button type="button" onClick={handleClose}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="field-label">Ініціали</label>
                <input type="text" value={form.initials} onChange={e => set('initials', e.target.value)}
                  className="field" />
              </div>
              <div>
                <label className="field-label">Стать</label>
                <select value={form.sex} onChange={e => set('sex', e.target.value)} className="field">
                  <option value="M">Чоловіча</option>
                  <option value="F">Жіноча</option>
                </select>
              </div>
              <div>
                <label className="field-label">Рік народження</label>
                <input type="number" value={form.birth_year}
                  onChange={e => set('birth_year', Number(e.target.value))}
                  className="field" min={1900} max={2100} />
              </div>
              <div>
                <label className="field-label">Вага (кг)</label>
                <input type="number" value={form.weight ?? ''}
                  onChange={e => set('weight', e.target.value ? Number(e.target.value) : null)}
                  className="field" step="0.1" min={1} />
              </div>
              <div>
                <label className="field-label">Зріст (см)</label>
                <input type="number" value={form.height ?? ''}
                  onChange={e => set('height', e.target.value ? Number(e.target.value) : null)}
                  className="field" min={1} />
              </div>
              <div>
                <label className="field-label">Група інвалідності</label>
                <select value={form.disability} onChange={e => set('disability', e.target.value)} className="field">
                  {DISABILITIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Діагноз</label>
                <select value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} className="field">
                  {DIAGNOSES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Гістологічне підтвердження</label>
                <select value={form.histologically_confirmed}
                  onChange={e => set('histologically_confirmed', e.target.value)} className="field">
                  <option value="YES">Так</option>
                  <option value="NO">Ні</option>
                  <option value="UNKNOWN">Невідомо</option>
                </select>
              </div>
              <div>
                <label className="field-label">Рік встановлення діагнозу</label>
                <input type="number" value={form.diagnosis_year ?? ''}
                  onChange={e => set('diagnosis_year', e.target.value ? Number(e.target.value) : null)}
                  className="field" min={1900} max={2100} />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Скасувати
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 bg-brand text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>

            {/* Email change section */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Зміна Email</p>
              <p className="text-xs text-gray-500">
                Поточний: <span className="font-medium text-gray-700">{patient.email}</span>
              </p>
              {emailSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                  Листа з підтвердженням надіслано на <strong>{newEmail}</strong>. Email зміниться після переходу за посиланням.
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="field flex-1 text-sm" placeholder="Новий email" />
                  <button type="button" onClick={handleEmailChange} disabled={emailSending || !newEmail}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 shrink-0">
                    {emailSending ? '...' : 'Надіслати листа'}
                  </button>
                </div>
              )}
              {emailError && <p className="text-xs text-red-600">{emailError}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
