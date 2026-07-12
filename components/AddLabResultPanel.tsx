'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LabType = 'CRP' | 'CALPROTECTIN';

export default function AddLabResultPanel({ patientId }: { patientId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [labType, setLabType] = useState<LabType>('CRP');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!value || !date) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/lab-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lab_type: labType, value: parseFloat(value), result_date: date }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail ?? d?.error ?? 'Помилка збереження');
      }
      setOpen(false);
      setValue('');
      setDate('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-brand hover:underline font-medium"
      >
        + Додати аналіз
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Додати результат аналізу</h2>
              <button type="button" onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="field-label">Тип аналізу</label>
                <select value={labType} onChange={e => setLabType(e.target.value as LabType)} className="field">
                  <option value="CRP">СРБ (мг/л)</option>
                  <option value="CALPROTECTIN">Кальпротектин (мкг/г)</option>
                </select>
              </div>
              <div>
                <label className="field-label">
                  {labType === 'CRP' ? 'Значення (мг/л)' : 'Значення (мкг/г)'}
                </label>
                <input type="number" value={value} onChange={e => setValue(e.target.value)}
                  className="field" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div>
                <label className="field-label">Дата аналізу</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="field" />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Скасувати
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving || !value || !date}
                className="flex-1 bg-brand text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
