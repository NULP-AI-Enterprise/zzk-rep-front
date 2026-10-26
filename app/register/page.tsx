'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDetail } from '@/lib/format';

type Region = { id: number; name: string };

const THIS_YEAR = new Date().getFullYear();

type Form = {
  initials: string;
  sex: 'M' | 'F';
  birth_year: string;
  email: string;
  region_id: string;
  weight: string;
  height: string;
  disability: string;
  diagnosis: string;
  histologically_confirmed: string;
  diagnosis_year: string;
  consent: boolean;
};

const INIT: Form = {
  initials: '',
  sex: 'M',
  birth_year: '',
  email: '',
  region_id: '',
  weight: '',
  height: '',
  disability: 'NONE',
  diagnosis: 'UNCLASSIFIED',
  histologically_confirmed: 'UNKNOWN',
  diagnosis_year: '',
  consent: false,
};

export default function RegisterPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [form, setForm] = useState<Form>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [regionsFailed, setRegionsFailed] = useState(false);

  useEffect(() => {
    fetch('/api/regions')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('regions'))))
      .then((d: unknown) => setRegions(Array.isArray(d) ? (d as Region[]) : []))
      .catch(() => setRegionsFailed(true));
  }, []);

  const set = <K extends keyof Form>(field: K, value: Form[K]) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.region_id) {
      setError('Оберіть регіон');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        initials: form.initials,
        sex: form.sex,
        birth_year: Number(form.birth_year),
        email: form.email.trim(),
        region_id: Number(form.region_id),
        disability: form.disability,
        diagnosis: form.diagnosis,
        histologically_confirmed: form.histologically_confirmed,
        consent: form.consent,
      };
      if (form.weight) body.weight = Number(form.weight);
      if (form.height) body.height = Number(form.height);
      if (form.diagnosis_year) body.diagnosis_year = Number(form.diagnosis_year);

      const res = await fetch('/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        setError(formatDetail(data?.detail ?? data?.error, 'Помилка реєстрації'));
      }
    } catch {
      setError('Мережева помилка. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-md text-center space-y-4">
          <div className="text-4xl text-green-500">✓</div>
          <h1 className="text-xl font-bold text-gray-800">Дякуємо за реєстрацію</h1>
          <p className="text-sm text-gray-500">
            Ми надіслали посилання для входу на <b>{form.email}</b>. Після входу лікар зможе
            прикріпити вас до свого списку пацієнтів.
          </p>
          <p className="text-xs text-gray-400">
            Лист не прийшов? Перевірте «Спам» або запросіть посилання ще раз на{' '}
            <Link href="/login" className="text-brand hover:underline">сторінці входу</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] w-full max-w-2xl space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Реєстрація пацієнта</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Вкажіть загальні дані про себе. Прізвище не збирається — лише ініціали.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Ініціали *" hint="ТГК — перші літери прізвища, імені, по батькові">
            <input
              type="text"
              required
              minLength={2}
              maxLength={4}
              value={form.initials}
              onChange={e => set('initials', e.target.value.replace(/[^\p{L}]/gu, '').toUpperCase())}
              placeholder="ТГК"
              className="field"
            />
          </Field>
          <Field label="Стать *">
            <select value={form.sex} onChange={e => set('sex', e.target.value as 'M' | 'F')} className="field">
              <option value="M">Чоловіча</option>
              <option value="F">Жіноча</option>
            </select>
          </Field>
          <Field label="Рік народження *">
            <input
              type="number"
              required
              min={1900}
              max={THIS_YEAR}
              value={form.birth_year}
              onChange={e => set('birth_year', e.target.value)}
              placeholder="1985"
              className="field"
            />
          </Field>
          <Field label="Email *">
            <input
              type="email"
              required
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="patient@example.com"
              className="field"
            />
          </Field>
          <Field label="Регіон *" hint={regionsFailed ? 'Не вдалося завантажити регіони. Оновіть сторінку.' : undefined}>
            <select value={form.region_id} onChange={e => set('region_id', e.target.value)} className="field">
              <option value="">— оберіть —</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Група інвалідності">
            <select value={form.disability} onChange={e => set('disability', e.target.value)} className="field">
              <option value="NONE">Відсутня</option>
              <option value="GROUP_1">I група</option>
              <option value="GROUP_2">II група</option>
              <option value="GROUP_3">III група</option>
            </select>
          </Field>
          <Field label="Вага (кг)">
            <input type="number" min={1} max={499} step="0.1" value={form.weight}
              onChange={e => set('weight', e.target.value)} placeholder="70" className="field" />
          </Field>
          <Field label="Зріст (см)">
            <input type="number" min={1} max={299} value={form.height}
              onChange={e => set('height', e.target.value)} placeholder="170" className="field" />
          </Field>
          <Field label="Діагноз">
            <select value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} className="field">
              <option value="UNCLASSIFIED">Не знаю / ЗЗК-некласифіковане</option>
              <option value="UC">Виразковий коліт (ВК)</option>
              <option value="CD">Хвороба Крона (ХК)</option>
            </select>
          </Field>
          <Field label="Рік встановлення діагнозу">
            <input type="number" min={1900} max={THIS_YEAR} value={form.diagnosis_year}
              onChange={e => set('diagnosis_year', e.target.value)} placeholder="2020" className="field" />
          </Field>
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={form.consent}
            onChange={e => set('consent', e.target.checked)}
            className="mt-1"
          />
          <span>Я погоджуюсь на обробку моїх даних у реєстрі пацієнтів із запальними захворюваннями кишківника.</span>
        </label>

        {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors active:scale-95 disabled:opacity-50"
        >
          {submitting ? 'Реєстрація...' : 'Зареєструватися'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Вже зареєстровані?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">Увійти</Link>
        </p>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}
