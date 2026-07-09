import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { AssessmentPoint } from '@/components/Pro2Chart';
import { pro2Severity } from '@/lib/pro2';
import Pro2ChartWrapper from '@/components/Pro2ChartWrapper';
import StatusAction from '@/components/StatusAction';

type TreatmentOut = { id: number; drug: string; other_drug_name: string | null };
type ClinicalRecordOut = {
  id: number; created_at: string;
  treatments: TreatmentOut[];
  strictures: boolean | null;
  steroid_dependence: boolean | null;
  steroid_resistance: boolean | null;
  smoking_status: string | null;
};

type PatientOut = {
  id: number; initials: string; surname: string | null; email: string;
  sex: string; diagnosis: string; status: string;
  birth_year: number; weight: number | null; height: number | null;
  histologically_confirmed: string; diagnosis_year: number | null;
  disability: string;
  doctor: { first_name: string; last_name: string } | null;
  region: { name: string } | null;
  created_at: string;
};

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

export default async function PatientDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const [patientRes, assessmentsRes, clinicalRes] = await Promise.all([
    backendFetch(`/api/v1/patients/${id}`, session.token),
    backendFetch(`/api/v1/patients/${id}/self-assessments`, session.token),
    backendFetch(`/api/v1/patients/${id}/records/clinical`, session.token),
  ]);

  if (patientRes.status === 401) redirect('/login');
  if (patientRes.status === 404) return <div className="p-8 text-gray-500">Пацієнта не знайдено.</div>;

  const patient: PatientOut = await patientRes.json();
  const assessmentsRaw = await assessmentsRes.json().catch(() => []);
  const assessments: AssessmentPoint[] = Array.isArray(assessmentsRaw)
    ? assessmentsRaw : (assessmentsRaw.items ?? assessmentsRaw.data ?? []);
  const clinicalRaw = await clinicalRes.json().catch(() => []);
  const clinicalRecords: ClinicalRecordOut[] = Array.isArray(clinicalRaw)
    ? clinicalRaw : (clinicalRaw.items ?? clinicalRaw.data ?? []);

  const latestClinical = clinicalRecords.at(-1) ?? null;
  const latestAssessment = assessments.filter(a => a.pro2_score !== null).at(-1) ?? null;
  const criticalSeverity = latestAssessment?.pro2_score != null
    ? pro2Severity(latestAssessment.pro2_score, latestAssessment.assessment_type)
    : null;
  const isCritical = criticalSeverity?.label === 'Тяжка';

  const s = statusMap[patient.status] ?? { label: patient.status, cls: 'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={session.role === 'ADMIN' ? '/admin/patients' : '/doctor'}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm">
          ← Назад
        </Link>
        <h1 className="text-2xl font-bold flex-1">{patient.initials}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
        {isCritical && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
            ⚠ Критичний PRO2
          </span>
        )}
        {session.role === 'DOCTOR' && (
          <>
            {patient.status === 'ATTACHED' && (
              <StatusAction
                patientId={Number(id)}
                currentStatus="ATTACHED"
                selfAttach
              />
            )}
            <Link href={`/doctor/patients/${id}/clinical/new`}
              className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
              + Клінічний запис
            </Link>
          </>
        )}
      </div>

      {/* Critical alert banner */}
      {isCritical && latestAssessment && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Увага:</strong> Останній PRO2 = {latestAssessment.pro2_score} — тяжка активність захворювання.
          Рекомендується консультація та корекція лікування.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General info */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Загальна інформація</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Ініціали" value={patient.initials} />
            {patient.surname && <Row label="Прізвище" value={patient.surname} />}
            <Row label="Стать" value={patient.sex === 'M' ? 'Чоловіча' : 'Жіноча'} />
            <Row label="Рік народження" value={String(patient.birth_year)} />
            {patient.weight && <Row label="Вага (кг)" value={String(patient.weight)} />}
            {patient.height && <Row label="Зріст (см)" value={String(patient.height)} />}
            <Row label="Регіон" value={patient.region?.name ?? '—'} />
            <Row label="Email" value={patient.email} />
            <Row label="Лікар" value={patient.doctor
              ? `${patient.doctor.last_name} ${patient.doctor.first_name}` : '—'} />
          </dl>
        </div>

        {/* Diagnosis */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Діагноз</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Діагноз" value={diagnosisLabel[patient.diagnosis] ?? patient.diagnosis} />
            <Row label="Гістологічне підтвердження"
              value={patient.histologically_confirmed === 'YES' ? 'Так'
                : patient.histologically_confirmed === 'NO' ? 'Ні' : 'Невідомо'} />
            {patient.diagnosis_year && <Row label="Рік діагнозу" value={String(patient.diagnosis_year)} />}
            <Row label="Група інвалідності"
              value={patient.disability === 'NONE' ? 'Відсутня'
                : patient.disability.replace('GROUP_', '') + ' група'} />
            {latestClinical?.smoking_status && (
              <Row label="Куріння"
                value={{ CURRENT: 'Курить', NEVER: 'Ніколи', FORMER: 'Колишній' }[latestClinical.smoking_status] ?? '—'} />
            )}
          </dl>
        </div>
      </div>

      {/* Current therapy */}
      {latestClinical && (
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Поточна терапія</h2>
            <span className="text-xs text-gray-400">
              Запис від {new Date(latestClinical.created_at).toLocaleDateString('uk-UA')}
            </span>
          </div>
          {latestClinical.treatments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {latestClinical.treatments.map(t => (
                <span key={t.id} className="px-3 py-1.5 bg-brand/10 text-brand text-sm font-medium rounded-lg">
                  {drugLabel[t.drug] ?? t.drug}
                  {t.other_drug_name && ` (${t.other_drug_name})`}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Препарати не зазначені.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {latestClinical.steroid_dependence && <span className="text-orange-600">⚠ Стероїдозалежність</span>}
            {latestClinical.steroid_resistance  && <span className="text-red-600">⚠ Стероїдорезистентність</span>}
            {latestClinical.strictures          && <span className="text-yellow-700">⚠ Стриктури</span>}
          </div>
        </div>
      )}

      {/* PRO2 chart */}
      {assessments.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold">Динаміка PRO2</h2>
            {latestAssessment?.pro2_score != null && criticalSeverity && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${criticalSeverity.bg} ${criticalSeverity.text}`}>
                Останній PRO2: {latestAssessment.pro2_score} — {criticalSeverity.label}
              </span>
            )}
          </div>
          <Pro2ChartWrapper assessments={assessments} />
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/>Ремісія</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"/>Помірна</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>Тяжка</span>
          </div>
        </div>
      )}

      {/* Assessment history table */}
      <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
        <h2 className="text-lg font-bold mb-4">Історія самооцінок</h2>
        {assessments.length === 0 ? (
          <p className="text-gray-500 text-sm">Самооцінок ще немає.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
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
      </div>
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
