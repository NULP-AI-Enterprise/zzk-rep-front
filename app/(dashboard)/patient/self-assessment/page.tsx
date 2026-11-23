'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pro2Severity } from '@/lib/pro2';

function calcPro2(type: 'CD' | 'UC', pain: number, stool: number, bleeding: number, freq: number) {
  if (type === 'CD') return pain * 5 + stool * 2;
  return bleeding + freq;
}

export default function PatientSelfAssessment() {
  const router = useRouter();
  const [type, setType] = useState<'UC' | 'CD'>('UC');
  const [diagnosisLocked, setDiagnosisLocked] = useState(false);
  const [cdPain, setCdPain] = useState(0);
  const [cdStool, setCdStool] = useState(0);
  const [ucBleeding, setUcBleeding] = useState(0);
  const [ucFreq, setUcFreq] = useState(0);
  const [firstDate, setFirstDate] = useState('');
  const [firstDesc, setFirstDesc] = useState('');
  const [factors, setFactors] = useState('');
  const [constip, setConstip] = useState<'' | 'yes' | 'no'>('');
  const [constipFreq, setConstipFreq] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(me => {
        if (me.diagnosis === 'CD' || me.diagnosis === 'UC') {
          setType(me.diagnosis);
          setDiagnosisLocked(true);
        }
      })
      .catch(() => {});
  }, []);

  const score = calcPro2(type, cdPain, cdStool, ucBleeding, ucFreq);
  const severity = pro2Severity(score, type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, unknown> = { assessment_type: type };
      if (type === 'CD') {
        body.cd_abdominal_pain = cdPain;
        body.cd_stool_count = cdStool;
      } else {
        body.uc_rectal_bleeding = ucBleeding;
        body.uc_defecation_freq = ucFreq;
      }
      if (firstDate) body.first_symptoms_date = firstDate;
      if (firstDesc.trim()) body.first_symptoms_desc = firstDesc.trim();
      if (factors.trim()) body.possible_factors = factors.trim();
      if (constip) body.constipation_on_flare = constip === 'yes';
      if (constip === 'yes' && constipFreq.trim()) body.constipation_stool_freq = constipFreq.trim();
      const res = await fetch('/api/self-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Помилка відправлення');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/patient'), 1500);
      }
    } catch {
      setError('Мережева помилка');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 text-center space-y-4">
        <div className="text-5xl text-green-500">✓</div>
        <p className="text-lg font-medium">Самооцінку збережено!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Анкета самооцінки</h1>
      <p className="text-gray-500">Дайте відповіді щодо вашого самопочуття за останні 7 днів.</p>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 space-y-8">

        <div className="space-y-3">
          <label className="block font-medium text-gray-800">Тип захворювання</label>
          {diagnosisLocked ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-xl text-sm font-medium">
              {type === 'UC' ? 'Виразковий коліт (ВК)' : 'Хвороба Крона (ХК)'}
              <span className="text-brand/50 text-xs">· визначено лікарем</span>
            </div>
          ) : (
            <div className="flex gap-6">
              {(['UC', 'CD'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value={t} checked={type === t}
                    onChange={() => setType(t)} className="text-brand focus:ring-brand" />
                  <span>{t === 'UC' ? 'Виразковий коліт (ВК)' : 'Хвороба Крона (ХК)'}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {type === 'CD' ? (
          <>
            <ScaleField label="Біль у животі (0 — немає, 3 — тяжкий)"
              name="cdPain" value={cdPain} onChange={setCdPain} />
            <div className="space-y-3">
              <label className="block font-medium text-gray-800">
                Кількість рідких випорожнень на добу
              </label>
              <input type="number" min="0" max="20" value={cdStool}
                onChange={e => setCdStool(Math.max(0, Math.min(20, Number(e.target.value))))}
                className="w-full border-b border-black/50 bg-transparent py-2 outline-none focus:border-brand transition-colors" />
              <p className="text-xs text-gray-400">PRO2 (ХК) = біль × 5 + кількість стільця × 2</p>
            </div>
          </>
        ) : (
          <>
            <ScaleField label="Ректальна кровотеча (0 — немає, 3 — тяжка)"
              name="ucBleeding" value={ucBleeding} onChange={setUcBleeding} />
            <ScaleField label="Частота дефекацій (0 — норма, 3 — значно підвищена)"
              name="ucFreq" value={ucFreq} onChange={setUcFreq} />
            <p className="text-xs text-gray-400">Частковий індекс Mayo (ВК) = кровотеча + частота</p>
          </>
        )}

        <div className="space-y-4 border-t pt-6">
          <h2 className="font-bold text-gray-800">Загальні відомості (необов&apos;язково)</h2>
          <label className="block space-y-1 text-sm"><span className="font-medium">Коли з&apos;явилися перші симптоми</span>
            <input type="date" max={new Date().toISOString().slice(0, 10)} value={firstDate} onChange={e => setFirstDate(e.target.value)}
                   className="w-full border-b border-black/50 bg-transparent py-2 outline-none focus:border-brand" /></label>
          <label className="block space-y-1 text-sm"><span className="font-medium">Які симптоми були першими</span>
            <textarea value={firstDesc} onChange={e => setFirstDesc(e.target.value)} rows={2}
                      className="w-full border border-gray-200 rounded-xl p-2 outline-none focus:border-brand" /></label>
          <label className="block space-y-1 text-sm"><span className="font-medium">Які фактори могли вплинути</span>
            <textarea value={factors} onChange={e => setFactors(e.target.value)} rows={2}
                      className="w-full border border-gray-200 rounded-xl p-2 outline-none focus:border-brand" /></label>
          <label className="block space-y-1 text-sm"><span className="font-medium">Чи є закрепи при загостреннях</span>
            <select value={constip} onChange={e => setConstip(e.target.value as '' | 'yes' | 'no')}
                    className="w-full border-b border-black/50 bg-transparent py-2 outline-none focus:border-brand">
              <option value="">—</option><option value="yes">Так</option><option value="no">Ні</option>
            </select></label>
          {constip === 'yes' && (
              <label className="block space-y-1 text-sm"><span className="font-medium">Частота стулу при закрепах</span>
                <input value={constipFreq} onChange={e => setConstipFreq(e.target.value)}
                       className="w-full border-b border-black/50 bg-transparent py-2 outline-none focus:border-brand" /></label>
          )}
        </div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${severity.bg}`}>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
              {type === 'CD' ? 'PRO2 (ХК)' : 'Частковий Mayo (ВК)'}
            </p>
            <p className={`text-2xl font-bold ${severity.text}`}>{score}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${severity.bg} ${severity.text} border border-current/20`}>
            {severity.label}
          </span>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors active:scale-95 disabled:opacity-50">
          {submitting ? 'Надсилання...' : 'Відправити результати'}
        </button>
      </form>
    </div>
  );
}

function ScaleField({ label, name, value, onChange }: {
  label: string; name: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block font-medium text-gray-800">{label}</label>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map(v => (
          <label key={v} className={`flex-1 py-2 border rounded-xl text-center cursor-pointer transition-colors ${
            value === v ? 'border-brand bg-brand/10 text-brand font-medium' : 'border-gray-200 hover:border-brand/50'
          }`}>
            <input type="radio" name={name} value={v} checked={value === v}
              onChange={() => onChange(v)} className="sr-only" />
            {v}
          </label>
        ))}
      </div>
    </div>
  );
}
