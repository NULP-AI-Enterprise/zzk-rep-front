import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { AssessmentPoint } from '@/components/Pro2Chart';
import { pro2Severity } from '@/lib/pro2';
import Pro2ChartWrapper from '@/components/Pro2ChartWrapper';
import DetachPatientButton from '@/components/DetachPatientButton';

// ── Types ─────────────────────────────────────────────────────────────────────
type PatientOut = {
  id: number; initials: string; surname: string | null; email: string;
  sex: string; diagnosis: string; status: string;
  birth_year: number; weight: number | null; height: number | null;
  histologically_confirmed: string; diagnosis_year: number | null;
  disability: string;
  doctor: { id: number; first_name: string; last_name: string } | null;
  region: { name: string } | null;
  created_at: string; updated_at: string;
};

type TreatmentOut     = { id: number; drug: string; other_drug_name: string | null };
type ResistantDrugOut = { id: number; drug: string; other_drug_name: string | null };
type LabResultOut     = { id: number; lab_type: string; value: number; result_date: string };
type SurgeryOut       = { id: number; operation_date: string };

type ClinicalRecordOut = {
  id: number; created_at: string;
  strictures: boolean | null;
  penetrations_fistulas: boolean | null;
  fecal_incontinence: string | null;
  infectious_complications: string | null;
  abdominal_surgeries: boolean | null;
  steroid_dependence: boolean | null;
  steroid_resistance: boolean | null;
  advanced_therapy_resistance: boolean | null;
  smoking_status: string | null;
  side_effects: string | null;
  resistant_drugs_other: string | null;
  lab_results: LabResultOut[];
  surgeries: SurgeryOut[];
  treatments: TreatmentOut[];
  resistant_drugs: ResistantDrugOut[];
};

type CdComplicationOut = { complication: string };
type CdRecordOut = {
  id: number; created_at: string;
  localization: string | null; perianal_lesions: boolean | null;
  behavior: string | null; general_wellbeing: number | null;
  abdominal_pain: number | null; stool_count: number | null;
  abdominal_mass: number | null; ses_cd: string | null; ses_cd_other: string | null;
  harvey_bradshaw: number | null; comments: string | null;
  complications: CdComplicationOut[];
};

type UcRecordOut = {
  id: number; created_at: string;
  extent: string | null; stool_frequency: number | null;
  rectal_bleeding: number | null; physician_assessment: number | null;
  endoscopic_mayo: number | null; endoscopic_mayo_other: string | null;
  partial_mayo: number | null; comments: string | null;
};

// ── Label maps ────────────────────────────────────────────────────────────────
const diagnosisLabel: Record<string, string> = {
  UC: 'Виразковий коліт (ВК)', CD: 'Хвороба Крона (ХК)', UNCLASSIFIED: 'ЗЗК-некласифіковане',
};
const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Очікує',       cls: 'bg-yellow-50 text-yellow-700' },
  ATTACHED: { label: 'Активний',     cls: 'bg-green-50 text-green-700'   },
  DETACHED: { label: 'Відкріплений', cls: 'bg-gray-100 text-gray-600'    },
};
const drugLabel: Record<string, string> = {
  '5ASA': '5-АСА', BUDESONIDE: 'Будесонід', SYSTEMIC_STEROIDS: 'Системні стероїди',
  THIOPURINES: 'Тіопурини', METHOTREXATE: 'Метотрексат', ANTI_TNF: 'Анти-ФНП',
  VEDOLIZUMAB: 'Ведолізумаб', USTEKINUMAB: 'Устекінумаб',
  TOFACITINIB: 'Тофацитиніб', UPADACITINIB: 'Упадацитиніб', OTHER: 'Інше',
};
const resistantDrugLabel: Record<string, string> = {
  INFLIXIMAB: 'Інфліксимаб', ADALIMUMAB: 'Адалімумаб', VEDOLIZUMAB: 'Ведолізумаб',
  USTEKINUMAB: 'Устекінумаб', TOFACITINIB: 'Тофацитиніб', UPADACITINIB: 'Упадацитиніб', OTHER: 'Інше',
};
const complicationLabel: Record<string, string> = {
  ARTHRALGIA: 'Артралгія', UVEITIS: 'Увеїт', ERYTHEMA_NODOSUM: 'Вузлувата еритема',
  APHTHOUS_ULCERS: 'Афтозні виразки', PYODERMA: 'Піодермія гангренозна',
  ANAL_FISSURE: 'Анальна тріщина', NEW_FISTULA: 'Нова нориця', ABSCESS: 'Абсцес',
};
const localizationLabel: Record<string, string> = {
  L1: 'L1 — Клубова кишка', L2: 'L2 — Товста кишка', L3: 'L3 — Клубово-товстокишкова', L4: 'L4 — Верхні відділи',
};
const behaviorLabel: Record<string, string> = {
  B1: 'B1 — Запальна', B2: 'B2 — Стриктурувальна', B3: 'B3 — Пенетрувальна',
};
const extentLabel: Record<string, string> = {
  E1: 'E1 — Проктит', E2: 'E2 — Лівостороння', E3: 'E3 — Тотальна (паноколіт)',
};
const sesLabel: Record<string, string> = {
  SES0: 'SES-CD 0', SES1: 'SES-CD 1', SES2: 'SES-CD 2', SES3: 'SES-CD 3',
};
const endoMayoLabel: Record<number, string> = {
  0: '0 — Норма', 1: '1 — Легкий', 2: '2 — Помірний', 3: '3 — Тяжкий',
};

function yesNo(v: boolean | null) {
  if (v === null || v === undefined) return '—';
  return v ? 'Так' : 'Ні';
}

function cdSeverity(hbi: number | null) {
  if (hbi === null) return null;
  if (hbi < 5)  return { label: 'Ремісія',  cls: 'bg-green-50 text-green-700'  };
  if (hbi <= 7)  return { label: 'Легка',    cls: 'bg-blue-50 text-blue-700'    };
  if (hbi <= 16) return { label: 'Помірна',  cls: 'bg-orange-50 text-orange-700'};
  return           { label: 'Тяжка',    cls: 'bg-red-50 text-red-700'      };
}
function ucSeverity(pm: number | null) {
  if (pm === null) return null;
  if (pm <= 1) return { label: 'Ремісія', cls: 'bg-green-50 text-green-700'  };
  if (pm <= 4) return { label: 'Легка',   cls: 'bg-blue-50 text-blue-700'    };
  if (pm <= 7) return { label: 'Помірна', cls: 'bg-orange-50 text-orange-700'};
  return        { label: 'Тяжка',  cls: 'bg-red-50 text-red-700'      };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default async function PatientDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const [patientRes, assessmentsRes, clinicalRes, cdRes, ucRes] = await Promise.all([
    backendFetch(`/api/v1/patients/${id}`, session.token),
    backendFetch(`/api/v1/patients/${id}/self-assessments`, session.token),
    backendFetch(`/api/v1/patients/${id}/records/clinical`, session.token),
    backendFetch(`/api/v1/patients/${id}/records/cd`, session.token),
    backendFetch(`/api/v1/patients/${id}/records/uc`, session.token),
  ]);

  if (patientRes.status === 401) redirect('/login');
  if (patientRes.status === 404) return <div className="p-8 text-gray-500">Пацієнта не знайдено.</div>;

  const patient: PatientOut = await patientRes.json();

  const assessmentsRaw  = await assessmentsRes.json().catch(() => []);
  const clinicalRaw     = await clinicalRes.json().catch(() => []);
  const cdRaw           = await cdRes.json().catch(() => []);
  const ucRaw           = await ucRes.json().catch(() => []);

  const assessments: AssessmentPoint[] = Array.isArray(assessmentsRaw)
    ? assessmentsRaw : (assessmentsRaw.items ?? assessmentsRaw.data ?? []);
  const clinicalRecords: ClinicalRecordOut[] = Array.isArray(clinicalRaw)
    ? clinicalRaw : (clinicalRaw.items ?? clinicalRaw.data ?? []);
  const cdRecords: CdRecordOut[] = Array.isArray(cdRaw) ? cdRaw : [];
  const ucRecords: UcRecordOut[] = Array.isArray(ucRaw) ? ucRaw : [];

  const latestClinical   = clinicalRecords.at(-1) ?? null;
  const latestCd         = cdRecords.at(-1) ?? null;
  const latestUc         = ucRecords.at(-1) ?? null;
  const latestAssessment = assessments.filter(a => a.pro2_score !== null).at(-1) ?? null;
  const criticalSeverity = latestAssessment?.pro2_score != null
    ? pro2Severity(latestAssessment.pro2_score, latestAssessment.assessment_type) : null;
  const isCritical = criticalSeverity?.label === 'Тяжка';

  const isDoctor = session.role === 'DOCTOR';
  const s = statusMap[patient.status] ?? { label: patient.status, cls: 'bg-gray-100 text-gray-600' };

  // Collect all surgeries across all clinical records
  const allSurgeries = clinicalRecords.flatMap(r => r.surgeries)
    .sort((a, b) => a.operation_date.localeCompare(b.operation_date));

  // Collect all lab results across all clinical records
  const allLabs = clinicalRecords.flatMap(r => r.lab_results)
    .sort((a, b) => a.result_date.localeCompare(b.result_date));
  const crpLabs          = allLabs.filter(l => l.lab_type === 'CRP');
  const calprotectinLabs = allLabs.filter(l => l.lab_type === 'CALPROTECTIN');

  const hbiSev = cdSeverity(latestCd?.harvey_bradshaw ?? null);
  const pmSev  = ucSeverity(latestUc?.partial_mayo ?? null);

  const backHref = session.role === 'ADMIN' ? '/admin/patients' : '/doctor';

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={backHref} className="text-gray-400 hover:text-gray-700 transition-colors text-sm">← Назад</Link>
        <h1 className="text-2xl font-bold flex-1">{patient.initials}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
        {isCritical && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
            ⚠ Критичний PRO2
          </span>
        )}
        {isDoctor && (
          <Link href={`/doctor/patients/${id}/clinical/new`}
            className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
            + Клінічний запис
          </Link>
        )}
      </div>

      {isCritical && latestAssessment && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Увага:</strong> Останній PRO2 = {latestAssessment.pro2_score} — тяжка активність захворювання.
          Рекомендується консультація та корекція лікування.
        </div>
      )}

      {/* ── Row 1: Загальна інфо + Діагноз ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Загальна інформація */}
        <Card title="Загальна інформація">
          <dl className="space-y-3 text-sm">
            <Row label="Ініціали"      value={patient.initials} />
            {patient.surname && <Row label="Прізвище"    value={patient.surname} />}
            <Row label="Стать"         value={patient.sex === 'M' ? 'Чоловіча' : 'Жіноча'} />
            <Row label="Рік народження" value={String(patient.birth_year)} />
            {patient.weight != null && (
              <Row label="Вага (кг)"   value={String(patient.weight)} />
            )}
            {patient.height != null && (
              <Row label="Зріст (см)"  value={String(patient.height)} />
            )}
            {patient.weight != null && patient.height != null && (
              <Row label="ІМТ"
                value={`${(patient.weight / ((patient.height / 100) ** 2)).toFixed(1)} кг/м²`} />
            )}
            <Row label="Регіон"        value={patient.region?.name ?? '—'} />
            <Row label="Email"         value={patient.email} />
            <Row label="Лікар"         value={patient.doctor
              ? `${patient.doctor.last_name} ${patient.doctor.first_name}` : '—'} />
            <Row label="Статус"        value={s.label} />
            <Row label="Дата реєстрації"
              value={new Date(patient.created_at).toLocaleDateString('uk-UA')} />
          </dl>
        </Card>

        {/* Діагноз */}
        <Card title="Діагноз та інвалідність">
          <dl className="space-y-3 text-sm">
            <Row label="Нозологія"     value={diagnosisLabel[patient.diagnosis] ?? patient.diagnosis} />
            <Row label="Гістологічне підтвердження"
              value={patient.histologically_confirmed === 'YES' ? 'Так'
                : patient.histologically_confirmed === 'NO' ? 'Ні' : 'Невідомо'} />
            {patient.diagnosis_year && (
              <Row label="Рік встановлення діагнозу" value={String(patient.diagnosis_year)} />
            )}
            <Row label="Група інвалідності"
              value={patient.disability === 'NONE' ? 'Відсутня'
                : patient.disability.replace('GROUP_', '') + ' група'} />
            {latestClinical?.smoking_status && (
              <Row label="Статус куріння"
                value={{ CURRENT: 'Курить', NEVER: 'Ніколи не курив', FORMER: 'Колишній курець' }
                  [latestClinical.smoking_status] ?? '—'} />
            )}
          </dl>
        </Card>
      </div>

      {/* ── Активність захворювання ── */}
      {patient.diagnosis === 'CD' && latestCd && (
        <Card title={`Активність ХК — HBI ${latestCd.harvey_bradshaw ?? '—'} ${hbiSev ? `(${hbiSev.label})` : ''}`}
          badge={hbiSev ? { label: hbiSev.label, cls: hbiSev.cls } : undefined}
          subtitle={`Запис від ${new Date(latestCd.created_at).toLocaleDateString('uk-UA')}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {latestCd.localization && (
              <Row label="Локалізація (Монреаль)" value={localizationLabel[latestCd.localization] ?? latestCd.localization} />
            )}
            {latestCd.behavior && (
              <Row label="Поведінка (Монреаль)"   value={behaviorLabel[latestCd.behavior] ?? latestCd.behavior} />
            )}
            <Row label="Періанальне ураження"     value={yesNo(latestCd.perianal_lesions)} />
            {latestCd.general_wellbeing != null && (
              <Row label="Загальне самопочуття"   value={`${latestCd.general_wellbeing}/4`} />
            )}
            {latestCd.abdominal_pain != null && (
              <Row label="Абдомінальний біль"     value={`${latestCd.abdominal_pain}/3`} />
            )}
            {latestCd.stool_count != null && (
              <Row label="Рідкий стілець (добу)"  value={String(latestCd.stool_count)} />
            )}
            {latestCd.abdominal_mass != null && (
              <Row label="Абдомінальна маса"      value={`${latestCd.abdominal_mass}/3`} />
            )}
            {latestCd.ses_cd && (
              <Row label="SES-CD"                 value={sesLabel[latestCd.ses_cd] ?? latestCd.ses_cd} />
            )}
            {latestCd.ses_cd_other && (
              <Row label="SES-CD (інше)"          value={latestCd.ses_cd_other} />
            )}
          </div>
          {latestCd.complications.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Позакишкові ускладнення</p>
              <div className="flex flex-wrap gap-2">
                {latestCd.complications.map(c => (
                  <span key={c.complication} className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg">
                    {complicationLabel[c.complication] ?? c.complication}
                  </span>
                ))}
              </div>
            </div>
          )}
          {latestCd.comments && (
            <p className="mt-3 text-sm text-gray-600 italic border-t border-gray-100 pt-3">{latestCd.comments}</p>
          )}
          {cdRecords.length > 1 && (
            <p className="mt-2 text-xs text-gray-400">Всього записів ХК: {cdRecords.length}</p>
          )}
        </Card>
      )}

      {patient.diagnosis === 'UC' && latestUc && (
        <Card title={`Активність ВК — Partial Mayo ${latestUc.partial_mayo ?? '—'} ${pmSev ? `(${pmSev.label})` : ''}`}
          badge={pmSev ? { label: pmSev.label, cls: pmSev.cls } : undefined}
          subtitle={`Запис від ${new Date(latestUc.created_at).toLocaleDateString('uk-UA')}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {latestUc.extent && (
              <Row label="Поширеність (Монреаль)" value={extentLabel[latestUc.extent] ?? latestUc.extent} />
            )}
            {latestUc.stool_frequency != null && (
              <Row label="Частота стільця"        value={`${latestUc.stool_frequency}/3`} />
            )}
            {latestUc.rectal_bleeding != null && (
              <Row label="Ректальна кровотеча"    value={`${latestUc.rectal_bleeding}/3`} />
            )}
            {latestUc.physician_assessment != null && (
              <Row label="Оцінка лікаря"          value={`${latestUc.physician_assessment}/3`} />
            )}
            {latestUc.endoscopic_mayo != null && (
              <Row label="Ендоскопічна Mayo"
                value={endoMayoLabel[latestUc.endoscopic_mayo] ?? String(latestUc.endoscopic_mayo)} />
            )}
            {latestUc.endoscopic_mayo_other && (
              <Row label="Ендоскопія (опис)"      value={latestUc.endoscopic_mayo_other} />
            )}
          </div>
          {latestUc.comments && (
            <p className="mt-3 text-sm text-gray-600 italic border-t border-gray-100 pt-3">{latestUc.comments}</p>
          )}
          {ucRecords.length > 1 && (
            <p className="mt-2 text-xs text-gray-400">Всього записів ВК: {ucRecords.length}</p>
          )}
        </Card>
      )}

      {/* ── Клінічний статус ── */}
      {latestClinical && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Ускладнення та хірургія */}
          <Card title="Ускладнення та супутні стани"
            subtitle={`Запис від ${new Date(latestClinical.created_at).toLocaleDateString('uk-UA')}`}>
            <dl className="space-y-3 text-sm">
              <Row label="Стриктури"                    value={yesNo(latestClinical.strictures)} />
              <Row label="Пенетрації / нориці"          value={yesNo(latestClinical.penetrations_fistulas)} />
              <Row label="Нетримання калу"              value={latestClinical.fecal_incontinence ?? '—'} />
              <Row label="Інфекційні ускладнення"       value={latestClinical.infectious_complications ?? '—'} />
              <Row label="Абдомінальні операції в анамнезі" value={yesNo(latestClinical.abdominal_surgeries)} />
              <Row label="Стероїдозалежність"           value={yesNo(latestClinical.steroid_dependence)} />
              <Row label="Стероїдорезистентність"       value={yesNo(latestClinical.steroid_resistance)} />
              <Row label="Резистентність до біол. терапії" value={yesNo(latestClinical.advanced_therapy_resistance)} />
              {latestClinical.side_effects && (
                <Row label="Побічні ефекти"             value={latestClinical.side_effects} />
              )}
            </dl>
          </Card>

          {/* Терапія */}
          <Card title="Терапія">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Поточна терапія</p>
                {latestClinical.treatments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {latestClinical.treatments.map(t => (
                      <span key={t.id} className="px-3 py-1.5 bg-brand/10 text-brand text-xs font-medium rounded-lg">
                        {drugLabel[t.drug] ?? t.drug}
                        {t.other_drug_name && ` (${t.other_drug_name})`}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">Не зазначено</p>}
              </div>

              {latestClinical.resistant_drugs.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Резистентність до препаратів</p>
                  <div className="flex flex-wrap gap-2">
                    {latestClinical.resistant_drugs.map(d => (
                      <span key={d.id} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg">
                        {resistantDrugLabel[d.drug] ?? d.drug}
                        {d.other_drug_name && ` (${d.other_drug_name})`}
                      </span>
                    ))}
                  </div>
                  {latestClinical.resistant_drugs_other && (
                    <p className="text-xs text-gray-500 mt-1">{latestClinical.resistant_drugs_other}</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Операції та лабораторія ── */}
      {(allSurgeries.length > 0 || allLabs.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Операції */}
          {allSurgeries.length > 0 && (
            <Card title={`Хірургічні втручання (${allSurgeries.length})`}>
              <ul className="space-y-2 text-sm">
                {allSurgeries.map(s => (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <span>{new Date(s.operation_date).toLocaleDateString('uk-UA')}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Лабораторні показники */}
          {allLabs.length > 0 && (
            <Card title="Лабораторні показники">
              <div className="space-y-4">
                {crpLabs.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      СРБ (мг/л) — норма &lt; 5
                    </p>
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-gray-100">
                        {crpLabs.map(l => (
                          <tr key={l.id}>
                            <td className="py-1.5 text-gray-500">
                              {new Date(l.result_date).toLocaleDateString('uk-UA')}
                            </td>
                            <td className={`py-1.5 font-medium text-right ${l.value > 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {l.value} мг/л
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {calprotectinLabs.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Кальпротектин (мкг/г) — норма &lt; 50
                    </p>
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-gray-100">
                        {calprotectinLabs.map(l => (
                          <tr key={l.id}>
                            <td className="py-1.5 text-gray-500">
                              {new Date(l.result_date).toLocaleDateString('uk-UA')}
                            </td>
                            <td className={`py-1.5 font-medium text-right ${l.value > 50 ? 'text-red-600' : 'text-green-600'}`}>
                              {l.value} мкг/г
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── PRO2 chart ── */}
      {assessments.length > 0 && (
        <Card title="Динаміка PRO2"
          badge={latestAssessment?.pro2_score != null && criticalSeverity
            ? { label: `PRO2: ${latestAssessment.pro2_score} — ${criticalSeverity.label}`, cls: `${criticalSeverity.bg} ${criticalSeverity.text}` }
            : undefined}>
          <Pro2ChartWrapper assessments={assessments} />
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Ремісія</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />Помірна</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Тяжка</span>
          </div>
        </Card>
      )}

      {/* ── Самооцінки ── */}
      <Card title={`Історія самооцінок (${assessments.length})`}>
        {assessments.length === 0 ? (
          <p className="text-gray-500 text-sm">Самооцінок ще немає.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Тип</th>
                  <th className="px-4 py-3 font-medium">PRO2</th>
                  <th className="px-4 py-3 font-medium">Стан</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...assessments].reverse().map(a => {
                  const sev = a.pro2_score != null ? pro2Severity(a.pro2_score, a.assessment_type) : null;
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-3">{new Date(a.created_at).toLocaleDateString('uk-UA')}</td>
                      <td className="px-4 py-3 text-gray-500">{a.assessment_type === 'CD' ? 'ХК' : 'ВК'}</td>
                      <td className="px-4 py-3 font-medium">{a.pro2_score ?? '—'}</td>
                      <td className="px-4 py-3">
                        {sev && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev.bg} ${sev.text}`}>
                            {sev.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Клінічні записи — список ── */}
      {clinicalRecords.length > 1 && (
        <Card title={`Всі клінічні записи (${clinicalRecords.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Препарати</th>
                  <th className="px-4 py-3 font-medium">Стероїдозалежність</th>
                  <th className="px-4 py-3 font-medium">Стероїдорезистентність</th>
                  <th className="px-4 py-3 font-medium">Операції</th>
                  <th className="px-4 py-3 font-medium">СРБ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...clinicalRecords].reverse().map(r => {
                  const latestCrp = r.lab_results.filter(l => l.lab_type === 'CRP').at(-1);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('uk-UA')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                        {r.treatments.map(t => drugLabel[t.drug] ?? t.drug).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.steroid_dependence ? <span className="text-orange-600 font-medium">Так</span> : <span className="text-gray-400">Ні</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.steroid_resistance ? <span className="text-red-600 font-medium">Так</span> : <span className="text-gray-400">Ні</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.surgeries.length > 0
                          ? r.surgeries.map(s => new Date(s.operation_date).toLocaleDateString('uk-UA')).join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {latestCrp
                          ? <span className={latestCrp.value > 5 ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {latestCrp.value} мг/л
                            </span>
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Дії з пацієнтом ── */}
      {isDoctor && patient.status === 'ATTACHED' && (
        <DetachPatientButton patientId={Number(id)} />
      )}
    </div>
  );
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function Card({
  title, subtitle, badge, children,
}: {
  title: string;
  subtitle?: string;
  badge?: { label: string; cls: string };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>{badge.label}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
