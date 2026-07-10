import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClinicalRecordForm from '@/components/ClinicalRecordForm';

type Diagnosis = 'UC' | 'CD' | 'UNCLASSIFIED';

const diagnosisLabel: Record<Diagnosis, string> = {
  UC: 'Виразковий коліт (ВК)',
  CD: 'Хвороба Крона (ХК)',
  UNCLASSIFIED: 'ЗЗК-некласифіковане',
};

export default async function NewClinicalRecord({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'DOCTOR') redirect('/login');

  const [patientRes, latestClinicalRes, latestCdRes, latestUcRes] = await Promise.all([
    backendFetch(`/api/v1/patients/${id}`, session.token),
    backendFetch(`/api/v1/patients/${id}/records/clinical/latest`, session.token),
    backendFetch(`/api/v1/patients/${id}/records/cd/latest`, session.token),
    backendFetch(`/api/v1/patients/${id}/records/uc/latest`, session.token),
  ]);

  if (patientRes.status === 401) redirect('/login');
  if (patientRes.status === 404)
    return <div className="p-8 text-gray-500">Пацієнта не знайдено.</div>;

  const patient = await patientRes.json();
  const diagnosis: Diagnosis =
    patient.diagnosis === 'CD' ? 'CD'
    : patient.diagnosis === 'UC' ? 'UC'
    : 'UNCLASSIFIED';

  const latestClinical = latestClinicalRes.ok
    ? await latestClinicalRes.json().catch(() => null)
    : null;
  const latestCd = latestCdRes.ok
    ? await latestCdRes.json().catch(() => null)
    : null;
  const latestUc = latestUcRes.ok
    ? await latestUcRes.json().catch(() => null)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={`/doctor/patients/${id}`}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm">
          ← Назад до картки
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новий клінічний запис</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {patient.initials} · {diagnosisLabel[diagnosis]}
          </p>
        </div>
      </div>

      {diagnosis === 'UNCLASSIFIED' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          Діагноз пацієнта — ЗЗК-некласифіковане. Форма відображає поля для Виразкового коліту.
          Уточніть діагноз у профілі пацієнта.
        </div>
      )}

      <ClinicalRecordForm
        patientId={id}
        diagnosis={diagnosis === 'UNCLASSIFIED' ? 'UC' : diagnosis}
        initialClinical={latestClinical}
        initialCd={latestCd}
        initialUc={latestUc}
      />
    </div>
  );
}
