'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Region = { id: number; name: string };

type Form = {
  initials: string;
  surname: string;
  sex: 'M' | 'F';
  email: string;
  birth_year: string;
  weight: string;
  height: string;
  region_id: string;
  disability: string;
  diagnosis: 'UC' | 'CD' | 'UNCLASSIFIED';
  histologically_confirmed: 'YES' | 'NO' | 'UNKNOWN';
  diagnosis_year: string;
};

const INIT: Form = {
  initials: '',
  surname: '',
  sex: 'M',
  email: '',
  birth_year: '',
  weight: '',
  height: '',
  region_id: '',
  disability: 'NONE',
  diagnosis: 'UC',
  histologically_confirmed: 'UNKNOWN',
  diagnosis_year: '',
};

export default function NewPatientForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [regions, setRegions] = useState<Region[]>([]);
  const [form, setForm] = useState<Form>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/regions')
      .then(r => r.json())
      .then((d: Region[]) => setRegions(d))
      .catch(() => {});
  }, []);

  const set = (field: keyof Form, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const goNext = () => {
    if (!form.initials || !form.email || !form.birth_year) {
      setError("Заповніть всі обов'язкові поля (*)");
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        initials: form.initials,
        sex: form.sex,
        email: form.email,
        birth_year: Number(form.birth_year),
        diagnosis: form.diagnosis,
        histologically_confirmed: form.histologically_confirmed,
        disability: form.disability,
      };
      if (form.surname) body.surname = form.surname;
      if (form.weight) body.weight = Number(form.weight);
      if (form.height) body.height = Number(form.height);
      if (form.region_id) body.region_id = Number(form.region_id);
      if (form.diagnosis_year) body.diagnosis_year = Number(form.diagnosis_year);

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          Array.isArray(data.detail)
            ? data.detail.map((d: { msg: string }) => d.msg).join('; ')
            : (data.error ?? 'Помилка реєстрації'),
        );
      } else {
        router.push(`/doctor/patients/${(data as { id: number }).id}`);
      }
    } catch {
      setError('Мережева помилка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Реєстрація нового пацієнта</h1>
        <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-sm font-medium">
          Крок {step} з 2
        </span>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Крок 1: Загальна інформація</h2>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Ініціали *" hint="О.П.П.">
                <input
                  type="text"
                  required
                  value={form.initials}
                  onChange={e => set('initials', e.target.value)}
                  placeholder="О.П.П."
                  className="field"
                />
              </Field>
              <Field label="Прізвище">
                <input
                  type="text"
                  value={form.surname}
                  onChange={e => set('surname', e.target.value)}
                  placeholder="Іванов"
                  className="field"
                />
              </Field>
              <Field label="Стать *">
                <select
                  value={form.sex}
                  onChange={e => set('sex', e.target.value)}
                  className="field"
                >
                  <option value="M">Чоловіча</option>
                  <option value="F">Жіноча</option>
                </select>
              </Field>
              <Field label="Рік народження *">
                <input
                  type="number"
                  required
                  min={1900}
                  max={2025}
                  value={form.birth_year}
                  onChange={e => set('birth_year', e.target.value)}
                  placeholder="1985"
                  className="field"
                />
              </Field>
              <Field label="Email *" className="col-span-2">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="patient@example.com"
                  className="field"
                />
              </Field>
              <Field label="Вага (кг)">
                <input
                  type="number"
                  value={form.weight}
                  onChange={e => set('weight', e.target.value)}
                  placeholder="70"
                  className="field"
                />
              </Field>
              <Field label="Зріст (см)">
                <input
                  type="number"
                  value={form.height}
                  onChange={e => set('height', e.target.value)}
                  placeholder="170"
                  className="field"
                />
              </Field>
              <Field label="Регіон">
                <select
                  value={form.region_id}
                  onChange={e => set('region_id', e.target.value)}
                  className="field"
                >
                  <option value="">— оберіть —</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Група інвалідності">
                <select
                  value={form.disability}
                  onChange={e => set('disability', e.target.value)}
                  className="field"
                >
                  <option value="NONE">Відсутня</option>
                  <option value="GROUP_1">I група</option>
                  <option value="GROUP_2">II група</option>
                  <option value="GROUP_3">III група</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Крок 2: Діагноз</h2>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Діагноз *">
                <select
                  value={form.diagnosis}
                  onChange={e => set('diagnosis', e.target.value)}
                  className="field"
                >
                  <option value="UC">Виразковий коліт (ВК)</option>
                  <option value="CD">Хвороба Крона (ХК)</option>
                  <option value="UNCLASSIFIED">ЗЗК-некласифіковане</option>
                </select>
              </Field>
              <Field label="Гістологічне підтвердження *">
                <select
                  value={form.histologically_confirmed}
                  onChange={e => set('histologically_confirmed', e.target.value)}
                  className="field"
                >
                  <option value="YES">Так</option>
                  <option value="NO">Ні</option>
                  <option value="UNKNOWN">Невідомо</option>
                </select>
              </Field>
              <Field label="Рік встановлення діагнозу">
                <input
                  type="number"
                  min={1950}
                  max={2026}
                  value={form.diagnosis_year}
                  onChange={e => set('diagnosis_year', e.target.value)}
                  placeholder="2020"
                  className="field"
                />
              </Field>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => { setError(''); setStep(s => s - 1); }}
            className="px-6 py-2 text-gray-500 font-medium hover:text-gray-800 disabled:opacity-50 transition-colors"
          >
            Назад
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              className="bg-brand text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-light transition-colors"
            >
              Далі
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="bg-brand text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50"
            >
              {submitting ? 'Реєстрація...' : 'Завершити реєстрацію'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
        {label}
        {hint && <span className="ml-1 normal-case font-normal text-gray-300">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
