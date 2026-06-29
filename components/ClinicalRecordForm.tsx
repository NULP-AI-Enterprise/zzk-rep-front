'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Diagnosis = 'UC' | 'CD' | 'UNCLASSIFIED';

const DRUGS = [
  { value: '5ASA',              label: '5-АСА' },
  { value: 'BUDESONIDE',        label: 'Будесонід' },
  { value: 'SYSTEMIC_STEROIDS', label: 'Системні стероїди' },
  { value: 'THIOPURINES',       label: 'Тіопурини' },
  { value: 'METHOTREXATE',      label: 'Метотрексат' },
  { value: 'ANTI_TNF',          label: 'Анти-ФНП' },
  { value: 'VEDOLIZUMAB',       label: 'Ведолізумаб' },
  { value: 'USTEKINUMAB',       label: 'Устекінумаб' },
  { value: 'TOFACITINIB',       label: 'Тофацитиніб' },
  { value: 'UPADACITINIB',      label: 'Упадацитиніб' },
  { value: 'OTHER',             label: 'Інше' },
];

const CD_COMPLICATIONS = [
  { value: 'arthralgia',       label: 'Артралгії' },
  { value: 'uveitis',          label: 'Увеїт' },
  { value: 'erythema_nodosum', label: 'Вузлувата еритема' },
  { value: 'aphthous_ulcers',  label: 'Афтозні виразки' },
  { value: 'pyoderma',         label: 'Піодермія гангренозна' },
  { value: 'anal_fissure',     label: 'Анальна тріщина' },
  { value: 'new_fistula',      label: 'Новий свищ' },
  { value: 'abscess',          label: 'Абсцес' },
];

type LabRow = { value: string; date: string };

function scoreSeverityUC(score: number) {
  if (score <= 1) return { label: 'Ремісія',  cls: 'bg-green-50 text-green-700' };
  if (score <= 4) return { label: 'Легка',    cls: 'bg-yellow-50 text-yellow-700' };
  if (score <= 7) return { label: 'Помірна',  cls: 'bg-orange-50 text-orange-700' };
  return                 { label: 'Тяжка',    cls: 'bg-red-50 text-red-700' };
}

function scoreSeverityCD(score: number) {
  if (score <  5) return { label: 'Ремісія',  cls: 'bg-green-50 text-green-700' };
  if (score <= 7) return { label: 'Легка',    cls: 'bg-yellow-50 text-yellow-700' };
  if (score <= 16)return { label: 'Помірна',  cls: 'bg-orange-50 text-orange-700' };
  return                 { label: 'Тяжка',    cls: 'bg-red-50 text-red-700' };
}

export default function ClinicalRecordForm({
  patientId,
  diagnosis,
}: {
  patientId: string;
  diagnosis: Diagnosis;
}) {
  const router = useRouter();
  const isCD = diagnosis === 'CD';

  // ── UC fields ──────────────────────────────────────────────
  const [ucStoolFreq,        setUcStoolFreq]        = useState(0);
  const [ucBlood,            setUcBlood]            = useState(0);
  const [ucPhysicianGlobal,  setUcPhysicianGlobal]  = useState(0);
  const [ucMayoEndoscopic,   setUcMayoEndoscopic]   = useState<string>('');

  // ── CD fields ──────────────────────────────────────────────
  const [cdWellbeing,   setCdWellbeing]   = useState(0);
  const [cdPain,        setCdPain]        = useState(0);
  const [cdStool,       setCdStool]       = useState(0);
  const [cdMass,        setCdMass]        = useState(0);
  const [cdComplics,    setCdComplics]    = useState<string[]>([]);
  const [cdLocalize,    setCdLocalize]    = useState('');
  const [cdBehavior,    setCdBehavior]    = useState('');
  const [cdPerianal,    setCdPerianal]    = useState('');
  const [cdSESCD,       setCdSESCD]       = useState('');

  // ── Common ─────────────────────────────────────────────────
  const [treatments,    setTreatments]    = useState<string[]>([]);
  const [otherDrug,     setOtherDrug]     = useState('');
  const [strictures,    setStrictures]    = useState(false);
  const [steroidDep,    setSteroidDep]    = useState(false);
  const [steroidRes,    setSteroidRes]    = useState(false);
  const [smoking,       setSmoking]       = useState('');
  const [crpRows,       setCrpRows]       = useState<LabRow[]>([{ value: '', date: '' }]);
  const [calpRows,      setCalpRows]      = useState<LabRow[]>([{ value: '', date: '' }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live scores
  const ucScore = ucStoolFreq + ucBlood + ucPhysicianGlobal;
  const cdScore = cdWellbeing + cdPain + cdStool + cdMass + cdComplics.length;
  const ucSev   = scoreSeverityUC(ucScore);
  const cdSev   = scoreSeverityCD(cdScore);

  function toggleComplication(val: string) {
    setCdComplics(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val],
    );
  }

  function toggleDrug(val: string) {
    setTreatments(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val],
    );
  }

  function setLabRow(
    rows: LabRow[],
    setRows: (r: LabRow[]) => void,
    index: number,
    field: keyof LabRow,
    value: string,
  ) {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    setRows(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const treatmentsList = treatments.map(drug => ({
      drug,
      other_drug_name: drug === 'OTHER' ? otherDrug || null : null,
    }));

    const labFilter = (rows: LabRow[]) =>
      rows.filter(r => r.value !== '' && r.date !== '').map(r => ({
        value: Number(r.value),
        date: r.date,
      }));

    const body: Record<string, unknown> = {
      treatments: treatmentsList,
      strictures,
      steroid_dependence: steroidDep,
      steroid_resistance: steroidRes,
      smoking_status: smoking || null,
      crp_values: labFilter(crpRows),
      calprotectin_values: labFilter(calpRows),
    };

    if (isCD) {
      body.cd_general_wellbeing = cdWellbeing;
      body.cd_abdominal_pain    = cdPain;
      body.cd_stool_count       = cdStool;
      body.cd_palpable_mass     = cdMass;
      body.cd_complications     = cdComplics;
      body.cd_hbi_score         = cdScore;
      if (cdLocalize) body.cd_localization = cdLocalize;
      if (cdBehavior) body.cd_behavior     = cdBehavior;
      if (cdPerianal) body.cd_perianal     = cdPerianal === 'YES';
      if (cdSESCD)    body.cd_sescd        = cdSESCD;
    } else {
      body.uc_stool_frequency      = ucStoolFreq;
      body.uc_blood_in_stool       = ucBlood;
      body.uc_physician_global     = ucPhysicianGlobal;
      body.uc_partial_mayo_score   = ucScore;
      if (ucMayoEndoscopic) body.mayo_endoscopic_score = Number(ucMayoEndoscopic);
    }

    try {
      const res = await fetch(`/api/patients/${patientId}/clinical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          Array.isArray(data.detail)
            ? data.detail.map((d: { msg: string }) => d.msg).join('; ')
            : (data.detail ?? data.error ?? 'Помилка збереження'),
        );
      } else {
        router.push(`/doctor/patients/${patientId}`);
        router.refresh();
      }
    } catch {
      setError('Мережева помилка');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">

      {/* ── Score banner ─────────────────────────────────────── */}
      <div className={`flex items-center justify-between p-5 rounded-2xl border ${isCD ? cdSev.cls : ucSev.cls}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">
            {isCD ? 'HBI (Харві-Бредшоу)' : 'Частковий Mayo'}
          </p>
          <p className="text-3xl font-bold">{isCD ? cdScore : ucScore}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold border border-current/20 ${isCD ? cdSev.cls : ucSev.cls}`}>
          {isCD ? cdSev.label : ucSev.label}
        </span>
      </div>

      {/* ── UC fields ────────────────────────────────────────── */}
      {!isCD && (
        <Card title="Оцінка лікаря (ВК) — Doc_Score_BK">
          <ScaleRow label="Частота стільця" max={3} value={ucStoolFreq} onChange={setUcStoolFreq}
            hint="0 — норма, 1 — 1-2 рази/добу, 2 — 3-4 рази/добу, 3 — ≥5 разів/добу" />
          <ScaleRow label="Кров у стільці" max={3} value={ucBlood} onChange={setUcBlood}
            hint="0 — немає, 1 — сліди, 2 — явна кров, 3 — переважно кров" />
          <ScaleRow label="Глобальна оцінка лікаря" max={3} value={ucPhysicianGlobal} onChange={setUcPhysicianGlobal}
            hint="0 — норма, 1 — легке, 2 — помірне, 3 — тяжке" />
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Ендоскопічний Mayo (Mayo Endoscopic Score)
            </label>
            <select
              value={ucMayoEndoscopic}
              onChange={e => setUcMayoEndoscopic(e.target.value)}
              className="field"
            >
              <option value="">— не визначено —</option>
              <option value="0">0 — Норма/неактивне</option>
              <option value="1">1 — Легке (еритема, втрата судинного малюнку)</option>
              <option value="2">2 — Помірне (виражена еритема, ерозії)</option>
              <option value="3">3 — Тяжке (спонтанна кровоточивість, виразки)</option>
            </select>
          </div>
        </Card>
      )}

      {/* ── CD fields ────────────────────────────────────────── */}
      {isCD && (
        <>
          <Card title="Оцінка лікаря (ХК) — HBI (Harvey-Bradshaw Index)">
            <ScaleRow label="Загальне самопочуття" max={4} value={cdWellbeing} onChange={setCdWellbeing}
              hint="0 — чудово, 1 — добре, 2 — задовільно, 3 — погано, 4 — дуже погано" />
            <ScaleRow label="Абдомінальний біль" max={3} value={cdPain} onChange={setCdPain}
              hint="0 — немає, 1 — легкий, 2 — помірний, 3 — сильний" />
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Кількість рідких випорожнень на добу
              </label>
              <input
                type="number" min="0" max="30" value={cdStool}
                onChange={e => setCdStool(Math.max(0, Math.min(30, Number(e.target.value))))}
                className="field w-32"
              />
            </div>
            <ScaleRow label="Абдомінальна маса" max={3} value={cdMass} onChange={setCdMass}
              hint="0 — немає, 1 — сумнівна, 2 — визначається, 3 — болюча" />

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Ускладнення <span className="normal-case font-normal text-gray-300">(1 бал за кожне)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CD_COMPLICATIONS.map(c => (
                  <label key={c.value} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                    cdComplics.includes(c.value)
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-gray-200 hover:border-brand/40'
                  }`}>
                    <input type="checkbox" className="sr-only"
                      checked={cdComplics.includes(c.value)}
                      onChange={() => toggleComplication(c.value)} />
                    <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      cdComplics.includes(c.value) ? 'bg-brand border-brand' : 'border-gray-300'
                    }`}>
                      {cdComplics.includes(c.value) && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 4l3 3 5-6" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Класифікація ХК (Montreal)">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Локалізація
                </label>
                <select value={cdLocalize} onChange={e => setCdLocalize(e.target.value)} className="field">
                  <option value="">— оберіть —</option>
                  <option value="L1">L1 — Термінальний клубовий</option>
                  <option value="L2">L2 — Товстий кишечник</option>
                  <option value="L3">L3 — Ілеоколіт</option>
                  <option value="L4">L4 — Верхній ШКТ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Поведінка хвороби
                </label>
                <select value={cdBehavior} onChange={e => setCdBehavior(e.target.value)} className="field">
                  <option value="">— оберіть —</option>
                  <option value="B1">B1 — Запальна (незвужуюча, непроникаюча)</option>
                  <option value="B2">B2 — Стриктуруюча</option>
                  <option value="B3">B3 — Проникаюча</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Періанальне ураження
                </label>
                <select value={cdPerianal} onChange={e => setCdPerianal(e.target.value)} className="field">
                  <option value="">— оберіть —</option>
                  <option value="YES">Так</option>
                  <option value="NO">Ні</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  SES-CD ендоскопія
                </label>
                <select value={cdSESCD} onChange={e => setCdSESCD(e.target.value)} className="field">
                  <option value="">— не визначено —</option>
                  <option value="0-2">0-2 (ремісія)</option>
                  <option value="3-6">3-6 (легка)</option>
                  <option value="7-15">7-15 (помірна)</option>
                  <option value=">15">&gt;15 (тяжка)</option>
                </select>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── Therapy ─────────────────────────────────────────── */}
      <Card title="Терапія">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DRUGS.map(d => (
            <label key={d.value} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
              treatments.includes(d.value)
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-gray-200 hover:border-brand/40'
            }`}>
              <input type="checkbox" className="sr-only"
                checked={treatments.includes(d.value)}
                onChange={() => toggleDrug(d.value)} />
              <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                treatments.includes(d.value) ? 'bg-brand border-brand' : 'border-gray-300'
              }`}>
                {treatments.includes(d.value) && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4l3 3 5-6" />
                  </svg>
                )}
              </span>
              <span className="text-sm">{d.label}</span>
            </label>
          ))}
        </div>
        {treatments.includes('OTHER') && (
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Назва препарату (інше)
            </label>
            <input type="text" value={otherDrug} onChange={e => setOtherDrug(e.target.value)}
              placeholder="Назва препарату" className="field" />
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Toggle label="Стероїдозалежність" value={steroidDep} onChange={setSteroidDep} />
          <Toggle label="Стероїдорезистентність" value={steroidRes} onChange={setSteroidRes} />
          <Toggle label="Стриктури" value={strictures} onChange={setStrictures} />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Статус куріння
          </label>
          <select value={smoking} onChange={e => setSmoking(e.target.value)} className="field w-64">
            <option value="">— оберіть —</option>
            <option value="NEVER">Ніколи не курив</option>
            <option value="CURRENT">Курить зараз</option>
            <option value="FORMER">Колишній курець</option>
          </select>
        </div>
      </Card>

      {/* ── Lab values ──────────────────────────────────────── */}
      <Card title="Лабораторні показники">
        <LabSection label="СРБ (мг/л)" rows={crpRows} setRows={setCrpRows} setRow={setLabRow} />
        <LabSection label="Кальпротектин (мкг/г)" rows={calpRows} setRows={setCalpRows} setRow={setLabRow} />
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pb-8">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          Скасувати
        </button>
        <button type="submit" disabled={submitting}
          className="flex-1 bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
          {submitting ? 'Збереження...' : 'Зберегти клінічний запис'}
        </button>
      </div>
    </form>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 space-y-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}

function ScaleRow({
  label, max, value, onChange, hint,
}: {
  label: string; max: number; value: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block font-medium text-gray-800 text-sm">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <div className="flex gap-2">
        {Array.from({ length: max + 1 }, (_, i) => i).map(v => (
          <label key={v} className={`flex-1 py-2.5 border rounded-xl text-center cursor-pointer transition-colors text-sm font-medium ${
            value === v
              ? 'border-brand bg-brand/10 text-brand'
              : 'border-gray-200 hover:border-brand/40 text-gray-600'
          }`}>
            <input type="radio" className="sr-only" checked={value === v} onChange={() => onChange(v)} />
            {v}
          </label>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label, value, onChange,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
      value ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <input type="checkbox" className="sr-only" checked={value} onChange={e => onChange(e.target.checked)} />
      <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
        value ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
      }`}>
        {value && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4l3 3 5-6" />
          </svg>
        )}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </label>
  );
}

function LabSection({
  label, rows, setRows, setRow,
}: {
  label: string;
  rows: LabRow[];
  setRows: (r: LabRow[]) => void;
  setRow: (rows: LabRow[], setRows: (r: LabRow[]) => void, i: number, f: keyof LabRow, v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
        <button type="button"
          onClick={() => setRows([...rows, { value: '', date: '' }])}
          className="text-xs text-brand hover:underline">
          + додати
        </button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-3 items-center">
          <input type="number" min="0" step="0.1" placeholder="Значення"
            value={row.value}
            onChange={e => setRow(rows, setRows, i, 'value', e.target.value)}
            className="field w-36" />
          <input type="date" value={row.date}
            onChange={e => setRow(rows, setRows, i, 'date', e.target.value)}
            className="field flex-1" />
          {rows.length > 1 && (
            <button type="button"
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
