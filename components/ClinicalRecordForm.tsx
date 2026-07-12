'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Diagnosis = 'UC' | 'CD' | 'UNCLASSIFIED';
type LabRow = { value: string; date: string };
type SurgeryRow = { date: string };

type InitialClinical = {
  treatments: { drug: string; other_drug_name: string | null }[];
  resistant_drugs: { drug: string; other_drug_name: string | null }[];
  strictures: boolean | null;
  penetrations_fistulas: boolean | null;
  abdominal_surgeries: boolean | null;
  steroid_dependence: boolean | null;
  steroid_resistance: boolean | null;
  advanced_therapy_resistance: boolean | null;
  smoking_status: string | null;
  created_at: string;
};
type InitialCd = {
  localization: string | null;
  behavior: string | null;
  perianal_lesions: boolean | null;
  created_at: string;
};
type InitialUc = {
  extent: string | null;
  created_at: string;
};

// ── Label lists ───────────────────────────────────────────────────────────────
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

const RESISTANT_DRUGS = [
  { value: 'INFLIXIMAB',   label: 'Інфліксимаб' },
  { value: 'ADALIMUMAB',   label: 'Адалімумаб' },
  { value: 'VEDOLIZUMAB',  label: 'Ведолізумаб' },
  { value: 'USTEKINUMAB',  label: 'Устекінумаб' },
  { value: 'TOFACITINIB',  label: 'Тофацитиніб' },
  { value: 'UPADACITINIB', label: 'Упадацитиніб' },
  { value: 'OTHER',        label: 'Інше' },
];

// Values match backend CdComplicationType enum (UPPERCASE)
const CD_COMPLICATIONS = [
  { value: 'ARTHRALGIA',       label: 'Артралгія' },
  { value: 'UVEITIS',          label: 'Увеїт' },
  { value: 'ERYTHEMA_NODOSUM', label: 'Вузлувата еритема' },
  { value: 'APHTHOUS_ULCERS',  label: 'Афтозні виразки' },
  { value: 'PYODERMA',         label: 'Піодермія гангренозна' },
  { value: 'ANAL_FISSURE',     label: 'Анальна тріщина' },
  { value: 'NEW_FISTULA',      label: 'Нова нориця' },
  { value: 'ABSCESS',          label: 'Абсцес' },
];

// ── Score helpers ─────────────────────────────────────────────────────────────
function ucSeverity(score: number) {
  if (score <= 1) return { label: 'Ремісія', cls: 'bg-green-50 text-green-700' };
  if (score <= 4) return { label: 'Легка',   cls: 'bg-yellow-50 text-yellow-700' };
  if (score <= 7) return { label: 'Помірна', cls: 'bg-orange-50 text-orange-700' };
  return               { label: 'Тяжка',   cls: 'bg-red-50 text-red-700' };
}
function cdSeverity(score: number) {
  if (score <  5) return { label: 'Ремісія', cls: 'bg-green-50 text-green-700' };
  if (score <= 7) return { label: 'Легка',   cls: 'bg-yellow-50 text-yellow-700' };
  if (score <= 16)return { label: 'Помірна', cls: 'bg-orange-50 text-orange-700' };
  return               { label: 'Тяжка',   cls: 'bg-red-50 text-red-700' };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ClinicalRecordForm({
  patientId,
  diagnosis,
  initialClinical = null,
  initialCd = null,
  initialUc = null,
}: {
  patientId: string;
  diagnosis: Diagnosis;
  initialClinical?: InitialClinical | null;
  initialCd?: InitialCd | null;
  initialUc?: InitialUc | null;
}) {
  const router = useRouter();
  const isCD = diagnosis === 'CD';
  const isUC = diagnosis === 'UC';

  // ── UC-specific fields (map to UcRecordCreate) ────────────────────────────
  const [ucExtent,        setUcExtent]        = useState(initialUc?.extent ?? '');
  const [ucStoolFreq,     setUcStoolFreq]     = useState(0);
  const [ucRectalBleeding,setUcRectalBleeding]= useState(0);
  const [ucPhysician,     setUcPhysician]     = useState(0);
  const [ucEndoMayo,      setUcEndoMayo]      = useState('');
  const [ucEndoMayoOther, setUcEndoMayoOther] = useState('');
  const [ucComments,      setUcComments]      = useState('');

  // ── CD-specific fields (map to CdRecordCreate) ────────────────────────────
  const [cdLocalization, setCdLocalization] = useState(initialCd?.localization ?? '');
  const [cdBehavior,     setCdBehavior]     = useState(initialCd?.behavior ?? '');
  const [cdPerianal,     setCdPerianal]     = useState(
    initialCd?.perianal_lesions === true ? 'YES' : initialCd?.perianal_lesions === false ? 'NO' : '',
  );
  const [cdWellbeing,    setCdWellbeing]    = useState(0);
  const [cdPain,         setCdPain]         = useState(0);
  const [cdStool,        setCdStool]        = useState(0);
  const [cdMass,         setCdMass]         = useState(0);
  const [cdSESCD,        setCdSESCD]        = useState('');
  const [cdSESOther,     setCdSESOther]     = useState('');
  const [cdComplics,     setCdComplics]     = useState<string[]>([]);
  const [cdComments,     setCdComments]     = useState('');

  // ── Common clinical fields (map to ClinicalRecordCreate) ──────────────────
  const [treatments, setTreatments] = useState<string[]>(
    initialClinical?.treatments.map(t => t.drug) ?? [],
  );
  const [otherDrugName, setOtherDrugName] = useState(
    initialClinical?.treatments.find(t => t.drug === 'OTHER')?.other_drug_name ?? '',
  );
  const [resistantDrugs, setResistantDrugs] = useState<string[]>(
    initialClinical?.resistant_drugs.map(d => d.drug) ?? [],
  );
  const [resistantDrugsOther, setResistantDrugsOther] = useState(
    initialClinical?.resistant_drugs.find(d => d.drug === 'OTHER')?.other_drug_name ?? '',
  );
  const [strictures,           setStrictures]          = useState<boolean | null>(initialClinical?.strictures ?? null);
  const [penetrationsFistulas, setPenetrationsFistulas]= useState<boolean | null>(initialClinical?.penetrations_fistulas ?? null);
  const [fecalIncontinence,    setFecalIncontinence]   = useState('');
  const [infectiousComplics,   setInfectiousComplics]  = useState('');
  const [abdominalSurgeries,   setAbdominalSurgeries]  = useState<boolean | null>(initialClinical?.abdominal_surgeries ?? null);
  const [steroidDep,           setSteroidDep]          = useState<boolean | null>(initialClinical?.steroid_dependence ?? null);
  const [steroidRes,           setSteroidRes]          = useState<boolean | null>(initialClinical?.steroid_resistance ?? null);
  const [advTherapyRes,        setAdvTherapyRes]       = useState<boolean | null>(initialClinical?.advanced_therapy_resistance ?? null);
  const [smoking,              setSmoking]             = useState(initialClinical?.smoking_status ?? '');
  const [sideEffects,          setSideEffects]         = useState('');
  const [surgeries,            setSurgeries]           = useState<SurgeryRow[]>([]);
  const [crpRows,              setCrpRows]             = useState<LabRow[]>([{ value: '', date: '' }]);
  const [calpRows,             setCalpRows]            = useState<LabRow[]>([{ value: '', date: '' }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live score
  const ucScore = ucStoolFreq + ucRectalBleeding + ucPhysician;
  const cdScore = cdWellbeing + cdPain + cdStool + cdMass + cdComplics.length;

  function toggleList(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val]);
  }

  function setLabRow(
    rows: LabRow[], setRows: (r: LabRow[]) => void,
    i: number, field: keyof LabRow, value: string,
  ) {
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Build lab_results in backend format
    const labResults = [
      ...crpRows.filter(r => r.value && r.date).map(r => ({
        lab_type: 'CRP', value: Number(r.value), result_date: r.date,
      })),
      ...calpRows.filter(r => r.value && r.date).map(r => ({
        lab_type: 'CALPROTECTIN', value: Number(r.value), result_date: r.date,
      })),
    ];

    // Build surgeries list
    const surgeriesList = surgeries.filter(s => s.date).map(s => ({ operation_date: s.date }));

    // Build treatments list
    const treatmentsList = treatments.map(drug => ({
      drug,
      other_drug_name: drug === 'OTHER' ? (otherDrugName || null) : null,
    }));

    // Build resistant drugs list
    const resistantList = resistantDrugs.map(drug => ({
      drug,
      other_drug_name: drug === 'OTHER' ? (resistantDrugsOther || null) : null,
    }));

    // ── Payload 1: /records/clinical ──────────────────────────────────────
    const clinicalBody: Record<string, unknown> = {
      treatments: treatmentsList,
      resistant_drugs: resistantList,
      lab_results: labResults,
      surgeries: surgeriesList,
      strictures,
      penetrations_fistulas: penetrationsFistulas,
      abdominal_surgeries: abdominalSurgeries,
      steroid_dependence: steroidDep,
      steroid_resistance: steroidRes,
      advanced_therapy_resistance: advTherapyRes,
      smoking_status: smoking || null,
    };
    if (fecalIncontinence)   clinicalBody.fecal_incontinence        = fecalIncontinence;
    if (infectiousComplics)  clinicalBody.infectious_complications   = infectiousComplics;
    if (sideEffects)         clinicalBody.side_effects               = sideEffects;
    if (resistantDrugsOther) clinicalBody.resistant_drugs_other      = resistantDrugsOther;

    // ── Payload 2: /records/cd or /records/uc ─────────────────────────────
    let diseaseBody: Record<string, unknown> | null = null;

    if (isCD) {
      diseaseBody = {
        general_wellbeing: cdWellbeing,
        abdominal_pain:    cdPain,
        stool_count:       cdStool,
        abdominal_mass:    cdMass,
        complications:     cdComplics,
      };
      if (cdLocalization) diseaseBody.localization    = cdLocalization;
      if (cdBehavior)     diseaseBody.behavior        = cdBehavior;
      if (cdPerianal)     diseaseBody.perianal_lesions = cdPerianal === 'YES';
      if (cdSESCD)        diseaseBody.ses_cd          = cdSESCD;
      if (cdSESOther)     diseaseBody.ses_cd_other    = cdSESOther;
      if (cdComments)     diseaseBody.comments        = cdComments;
    } else if (isUC) {
      diseaseBody = {
        stool_frequency:      ucStoolFreq,
        rectal_bleeding:      ucRectalBleeding,
        physician_assessment: ucPhysician,
      };
      if (ucExtent)       diseaseBody.extent              = ucExtent;
      if (ucEndoMayo)     diseaseBody.endoscopic_mayo     = Number(ucEndoMayo);
      if (ucEndoMayoOther)diseaseBody.endoscopic_mayo_other = ucEndoMayoOther;
      if (ucComments)     diseaseBody.comments            = ucComments;
    }

    try {
      // Send both requests in parallel
      const requests: Promise<Response>[] = [
        fetch(`/api/patients/${patientId}/clinical`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clinicalBody),
        }),
      ];

      const diseaseEndpoint = isCD ? 'cd' : isUC ? 'uc' : null;
      if (diseaseEndpoint && diseaseBody) {
        requests.push(
          fetch(`/api/patients/${patientId}/${diseaseEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(diseaseBody),
          }),
        );
      }

      const responses = await Promise.all(requests);
      const errors: string[] = [];

      for (const res of responses) {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = Array.isArray(data.detail)
            ? data.detail.map((d: { msg: string }) => d.msg).join('; ')
            : (data.detail ?? data.error ?? `Помилка (${res.status})`);
          errors.push(msg);
        }
      }

      if (errors.length > 0) {
        setError(errors.join(' | '));
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

  const sev = isCD ? cdSeverity(cdScore) : ucSeverity(ucScore);
  const score = isCD ? cdScore : ucScore;
  const scoreLabel = isCD ? 'HBI (Harvey-Bradshaw)' : 'Partial Mayo';

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">

      {/* ── Previous record notice ───────────────────────────────── */}
      {initialClinical && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <span className="text-lg leading-none mt-0.5">ℹ</span>
          <div>
            <p className="font-medium">Поля перенесено з попереднього запису</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Запис від {new Date(initialClinical.created_at).toLocaleDateString('uk-UA')} —
              {' '}перевірте та оновіть поля, що змінились. Симптоми (біль, стілець тощо) заповніть заново.
            </p>
          </div>
        </div>
      )}

      {/* ── Score banner ─────────────────────────────────────────── */}
      <div className={`flex items-center justify-between p-5 rounded-2xl border ${sev.cls}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">{scoreLabel}</p>
          <p className="text-3xl font-bold">{score}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold border border-current/20 ${sev.cls}`}>
          {sev.label}
        </span>
      </div>

      {/* ── UC specific ──────────────────────────────────────────── */}
      {isUC && (
        <>
          <Card title="Поширеність (Монреальська класифікація)">
            <RadioGroup
              label="Поширеність ВК"
              value={ucExtent}
              onChange={setUcExtent}
              options={[
                { value: 'E1', label: 'E1 — Проктит (до rectosigmoid junction)' },
                { value: 'E2', label: 'E2 — Лівостороння (до lienalis flexure)' },
                { value: 'E3', label: 'E3 — Тотальна (паноколіт)' },
              ]}
            />
          </Card>

          <Card title="Оцінка лікаря (ВК) — Partial Mayo">
            <ScaleRow label="Частота стільця" max={3} value={ucStoolFreq} onChange={setUcStoolFreq}
              hint="0 — норма, 1 — 1-2 рази/добу вище норми, 2 — 3-4 рази/добу, 3 — ≥5 разів/добу" />
            <ScaleRow label="Ректальна кровотеча" max={3} value={ucRectalBleeding} onChange={setUcRectalBleeding}
              hint="0 — немає, 1 — сліди крові &lt; 50% часу, 2 — явна кров ≥ 50% часу, 3 — тільки кров" />
            <ScaleRow label="Глобальна оцінка лікаря" max={3} value={ucPhysician} onChange={setUcPhysician}
              hint="0 — норма, 1 — легке, 2 — помірне, 3 — тяжке захворювання" />
            <div>
              <label className="field-label">Ендоскопічна Mayo (необов'язково)</label>
              <select value={ucEndoMayo} onChange={e => setUcEndoMayo(e.target.value)} className="field">
                <option value="">— не визначено —</option>
                <option value="0">0 — Норма / неактивне</option>
                <option value="1">1 — Легке (еритема, втрата судинного малюнку)</option>
                <option value="2">2 — Помірне (виражена еритема, ерозії)</option>
                <option value="3">3 — Тяжке (спонтанна кровоточивість, виразки)</option>
              </select>
            </div>
            {ucEndoMayo && (
              <div>
                <label className="field-label">Опис ендоскопії (необов'язково)</label>
                <input type="text" value={ucEndoMayoOther} onChange={e => setUcEndoMayoOther(e.target.value)}
                  className="field" placeholder="Додаткові деталі" />
              </div>
            )}
            <div>
              <label className="field-label">Коментар лікаря (необов'язково)</label>
              <textarea value={ucComments} onChange={e => setUcComments(e.target.value)}
                className="field min-h-[80px] resize-y" placeholder="Клінічні нотатки" />
            </div>
          </Card>
        </>
      )}

      {/* ── CD specific ──────────────────────────────────────────── */}
      {isCD && (
        <>
          <Card title="Класифікація ХК (Монреальська)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="field-label">Локалізація</label>
                <select value={cdLocalization} onChange={e => setCdLocalization(e.target.value)} className="field">
                  <option value="">— оберіть —</option>
                  <option value="L1">L1 — Клубова кишка</option>
                  <option value="L2">L2 — Товста кишка</option>
                  <option value="L3">L3 — Клубово-товстокишкова</option>
                  <option value="L4">L4 — Верхні відділи ШКТ</option>
                </select>
              </div>
              <div>
                <label className="field-label">Поведінка хвороби</label>
                <select value={cdBehavior} onChange={e => setCdBehavior(e.target.value)} className="field">
                  <option value="">— оберіть —</option>
                  <option value="B1">B1 — Запальна (незвужуюча)</option>
                  <option value="B2">B2 — Стриктурувальна</option>
                  <option value="B3">B3 — Пенетрувальна</option>
                </select>
              </div>
              <div>
                <label className="field-label">Періанальне ураження</label>
                <select value={cdPerianal} onChange={e => setCdPerianal(e.target.value)} className="field">
                  <option value="">— оберіть —</option>
                  <option value="YES">Так</option>
                  <option value="NO">Ні</option>
                </select>
              </div>
              <div>
                <label className="field-label">SES-CD (ендоскопія)</label>
                <select value={cdSESCD} onChange={e => setCdSESCD(e.target.value)} className="field">
                  <option value="">— не визначено —</option>
                  <option value="0-2">0–2 (ремісія)</option>
                  <option value="3-6">3–6 (легка)</option>
                  <option value="7-15">7–15 (помірна)</option>
                  <option value=">15">&gt;15 (тяжка)</option>
                </select>
              </div>
            </div>
            {cdSESCD && (
              <div>
                <label className="field-label">Опис ендоскопії SES-CD (необов'язково)</label>
                <input type="text" value={cdSESOther} onChange={e => setCdSESOther(e.target.value)}
                  className="field" placeholder="Деталі ендоскопічного дослідження" />
              </div>
            )}
          </Card>

          <Card title="Оцінка лікаря (ХК) — HBI (Harvey-Bradshaw Index)">
            <ScaleRow label="Загальне самопочуття" max={4} value={cdWellbeing} onChange={setCdWellbeing}
              hint="0 — чудово, 1 — добре, 2 — задовільно, 3 — погано, 4 — дуже погано" />
            <ScaleRow label="Абдомінальний біль" max={3} value={cdPain} onChange={setCdPain}
              hint="0 — немає, 1 — легкий, 2 — помірний, 3 — сильний" />
            <div>
              <label className="field-label">Кількість рідких випорожнень на добу</label>
              <input type="number" min="0" max="30" value={cdStool}
                onChange={e => setCdStool(Math.max(0, Math.min(30, Number(e.target.value))))}
                className="field w-32" />
            </div>
            <ScaleRow label="Абдомінальна маса" max={3} value={cdMass} onChange={setCdMass}
              hint="0 — немає, 1 — сумнівна, 2 — визначається, 3 — болюча" />

            <div>
              <label className="field-label">Позакишкові ускладнення <span className="normal-case font-normal text-gray-400">(1 бал за кожне)</span></label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CD_COMPLICATIONS.map(c => (
                  <CheckChip key={c.value} label={c.label}
                    checked={cdComplics.includes(c.value)}
                    onChange={() => toggleList(cdComplics, setCdComplics, c.value)} />
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Коментар лікаря (необов'язково)</label>
              <textarea value={cdComments} onChange={e => setCdComments(e.target.value)}
                className="field min-h-[80px] resize-y" placeholder="Клінічні нотатки" />
            </div>
          </Card>
        </>
      )}

      {/* ── Therapy ──────────────────────────────────────────────── */}
      <Card title="Терапія">
        <div>
          <label className="field-label">Поточні препарати</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {DRUGS.map(d => (
              <CheckChip key={d.value} label={d.label}
                checked={treatments.includes(d.value)}
                onChange={() => toggleList(treatments, setTreatments, d.value)} />
            ))}
          </div>
          {treatments.includes('OTHER') && (
            <div className="mt-3">
              <label className="field-label">Назва препарату (інше)</label>
              <input type="text" value={otherDrugName} onChange={e => setOtherDrugName(e.target.value)}
                placeholder="Назва препарату" className="field" />
            </div>
          )}
        </div>

        <div>
          <label className="field-label">Резистентність до препаратів</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {RESISTANT_DRUGS.map(d => (
              <CheckChip key={d.value} label={d.label}
                checked={resistantDrugs.includes(d.value)}
                onChange={() => toggleList(resistantDrugs, setResistantDrugs, d.value)}
                danger />
            ))}
          </div>
          {resistantDrugs.includes('OTHER') && (
            <div className="mt-3">
              <label className="field-label">Назва препарату (резистентність, інше)</label>
              <input type="text" value={resistantDrugsOther} onChange={e => setResistantDrugsOther(e.target.value)}
                placeholder="Назва" className="field" />
            </div>
          )}
        </div>

        <div>
          <label className="field-label">Статус куріння</label>
          <select value={smoking} onChange={e => setSmoking(e.target.value)} className="field w-64">
            <option value="">— оберіть —</option>
            <option value="NEVER">Ніколи не курив</option>
            <option value="CURRENT">Курить зараз</option>
            <option value="FORMER">Колишній курець</option>
          </select>
        </div>
      </Card>

      {/* ── Complications & complications ─────────────────────────── */}
      <Card title="Ускладнення та супутні стани">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <BoolSelect label="Стриктури" value={strictures} onChange={setStrictures} />
          <BoolSelect label="Пенетрації / нориці" value={penetrationsFistulas} onChange={setPenetrationsFistulas} />
          <BoolSelect label="Операції в анамнезі" value={abdominalSurgeries} onChange={setAbdominalSurgeries} />
          <BoolSelect label="Стероїдозалежність" value={steroidDep} onChange={setSteroidDep} />
          <BoolSelect label="Стероїдорезистентність" value={steroidRes} onChange={setSteroidRes} />
          <BoolSelect label="Резистентність до біол. терапії" value={advTherapyRes} onChange={setAdvTherapyRes} />
        </div>

        <div>
          <label className="field-label">Нетримання калу (опис, необов'язково)</label>
          <input type="text" value={fecalIncontinence} onChange={e => setFecalIncontinence(e.target.value)}
            className="field" placeholder="Деталі, якщо є" />
        </div>
        <div>
          <label className="field-label">Інфекційні ускладнення (опис, необов'язково)</label>
          <input type="text" value={infectiousComplics} onChange={e => setInfectiousComplics(e.target.value)}
            className="field" placeholder="Деталі, якщо є" />
        </div>
        <div>
          <label className="field-label">Побічні ефекти терапії (необов'язково)</label>
          <input type="text" value={sideEffects} onChange={e => setSideEffects(e.target.value)}
            className="field" placeholder="Опис побічних ефектів" />
        </div>
      </Card>

      {/* ── Surgeries ─────────────────────────────────────────────── */}
      <Card title="Хірургічні втручання">
        <div className="space-y-3">
          {surgeries.map((s, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span className="text-sm text-gray-500 w-24 shrink-0">Дата операції</span>
              <input type="date" value={s.date}
                onChange={e => {
                  const next = [...surgeries];
                  next[i] = { date: e.target.value };
                  setSurgeries(next);
                }}
                className="field flex-1" />
              <button type="button"
                onClick={() => setSurgeries(surgeries.filter((_, j) => j !== i))}
                className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none">×</button>
            </div>
          ))}
          <button type="button"
            onClick={() => setSurgeries([...surgeries, { date: '' }])}
            className="text-sm text-brand hover:underline">
            + Додати операцію
          </button>
        </div>
      </Card>

      {/* ── Lab values ────────────────────────────────────────────── */}
      <Card title="Лабораторні показники">
        <LabSection label="СРБ (мг/л) — норма < 5" rows={crpRows} setRows={setCrpRows} setRow={setLabRow} />
        <LabSection label="Кальпротектин (мкг/г) — норма < 50" rows={calpRows} setRows={setCalpRows} setRow={setLabRow} />
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
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

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 space-y-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}

function ScaleRow({ label, max, value, onChange, hint }: {
  label: string; max: number; value: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="block font-medium text-gray-800 text-sm">{label}</p>
      {hint && <p className="text-xs text-gray-400" dangerouslySetInnerHTML={{ __html: hint }} />}
      <div className="flex gap-2">
        {Array.from({ length: max + 1 }, (_, i) => i).map(v => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`flex-1 py-2.5 border rounded-xl text-center cursor-pointer transition-colors text-sm font-medium ${
              value === v ? 'border-brand bg-brand/10 text-brand' : 'border-gray-200 hover:border-brand/40 text-gray-600'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <p className="field-label">{label}</p>
      <div className="space-y-2">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-left ${
              value === o.value ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 hover:border-brand/40'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              value === o.value ? 'border-brand' : 'border-gray-300'
            }`}>
              {value === o.value && <span className="w-2 h-2 rounded-full bg-brand" />}
            </span>
            <span className="text-sm">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckChip({ label, checked, onChange, danger = false }: {
  label: string; checked: boolean; onChange: () => void; danger?: boolean;
}) {
  const active = danger
    ? 'border-red-300 bg-red-50 text-red-700'
    : 'border-brand bg-brand/5 text-brand';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
        checked ? active : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
        checked ? (danger ? 'bg-red-500 border-red-500' : 'bg-brand border-brand') : 'border-gray-300'
      }`}>
        {checked && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4l3 3 5-6" />
          </svg>
        )}
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function BoolSelect({ label, value, onChange }: {
  label: string; value: boolean | null; onChange: (v: boolean | null) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="field-label">{label}</label>
      <div className="flex gap-2">
        {([null, true, false] as const).map((v) => (
          <button key={String(v)} type="button"
            onClick={() => onChange(v)}
            className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${
              value === v
                ? v === true  ? 'bg-orange-100 border-orange-400 text-orange-700 font-medium'
                : v === false ? 'bg-gray-100 border-gray-400 text-gray-700 font-medium'
                              : 'bg-gray-50 border-gray-300 text-gray-500'
                : 'border-gray-200 hover:border-gray-300 text-gray-500'
            }`}>
            {v === null ? '—' : v ? 'Так' : 'Ні'}
          </button>
        ))}
      </div>
    </div>
  );
}

function LabSection({ label, rows, setRows, setRow }: {
  label: string;
  rows: LabRow[];
  setRows: (r: LabRow[]) => void;
  setRow: (rows: LabRow[], setRows: (r: LabRow[]) => void, i: number, f: keyof LabRow, v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="field-label">{label}</label>
        <button type="button" onClick={() => setRows([...rows, { value: '', date: '' }])}
          className="text-xs text-brand hover:underline">+ додати</button>
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
            <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none">×</button>
          )}
        </div>
      ))}
    </div>
  );
}
