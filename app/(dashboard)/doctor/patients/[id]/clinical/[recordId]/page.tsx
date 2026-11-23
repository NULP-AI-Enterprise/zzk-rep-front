import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';

type Rec = {
    id: number; created_at: string;
    strictures: boolean | null; penetrations_fistulas: boolean | null;
    fecal_incontinence: string | null; infectious_complications: string | null;
    abdominal_surgeries: boolean | null; steroid_dependence: boolean | null;
    steroid_resistance: boolean | null; advanced_therapy_resistance: boolean | null;
    smoking_status: string | null; side_effects: string | null; resistant_drugs_other: string | null;
    lab_results: { id: number; lab_type: string; value: number; result_date: string }[];
    surgeries: { id: number; operation_date: string; operation_name: string | null; description: string | null }[];
    treatments: { id: number; drug: string; other_drug_name: string | null }[];
    resistant_drugs: { id: number; drug: string; other_drug_name: string | null }[];
};

const drug: Record<string, string> = {
    '5ASA': '5-АСА', BUDESONIDE: 'Будесонід', SYSTEMIC_STEROIDS: 'Системні стероїди',
    THIOPURINES: 'Тіопурини', METHOTREXATE: 'Метотрексат', ANTI_TNF: 'Анти-ФНП',
    VEDOLIZUMAB: 'Ведолізумаб', USTEKINUMAB: 'Устекінумаб', TOFACITINIB: 'Тофацитиніб',
    UPADACITINIB: 'Упадацитиніб', INFLIXIMAB: 'Інфліксимаб', ADALIMUMAB: 'Адалімумаб', OTHER: 'Інше',
};
const smoking: Record<string, string> = { CURRENT: 'Курить', NEVER: 'Ніколи не курив', FORMER: 'Колишній курець' };
const yn = (v: boolean | null) => (v === null || v === undefined ? '—' : v ? 'Так' : 'Ні');
const d = (s: string) => new Date(s).toLocaleDateString('uk-UA');

export default async function ClinicalRecordPage({
                                                     params,
                                                 }: { params: Promise<{ id: string; recordId: string }> }) {
    const { id, recordId } = await params;
    const session = await getSession();
    if (!session) redirect('/login');

    const [recRes, listRes] = await Promise.all([
        backendFetch(`/api/v1/patients/${id}/records/clinical/${recordId}`, session.token),
        backendFetch(`/api/v1/patients/${id}/records/clinical`, session.token),
    ]);
    if (recRes.status === 401) redirect('/login');
    if (recRes.status === 403) return <div className="p-8 text-gray-500">Немає доступу.</div>;
    if (!recRes.ok) return <div className="p-8 text-gray-500">Запис не знайдено.</div>;

    const r: Rec = await recRes.json();
    const all: { id: number }[] = listRes.ok ? await listRes.json().catch(() => []) : [];
    const ids = all.map(x => x.id).sort((a, b) => a - b);
    const idx = ids.indexOf(r.id);
    const prev = idx > 0 ? ids[idx - 1] : null;
    const next = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;
    const base =
        session.role === 'ADMIN' ? `/admin/patients/${id}`
            : session.role === 'MODERATOR' ? `/moderator/patients/${id}`
                : `/doctor/patients/${id}`;

    return (
        <div className="space-y-6 max-w-3xl">
            <Link href={base} className="text-sm text-brand hover:underline">← До картки пацієнта</Link>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-bold">Клінічний запис від {d(r.created_at)}</h1>
                <div className="flex gap-3 text-sm">
                    {prev && <Link href={`${base}/clinical/${prev}`} className="text-brand hover:underline">← Попередній</Link>}
                    {next && <Link href={`${base}/clinical/${next}`} className="text-brand hover:underline">Наступний →</Link>}
                </div>
            </div>

            <Box title="Загальне">
                <Row l="Стриктури" v={yn(r.strictures)} />
                <Row l="Пенетрації, нориці" v={yn(r.penetrations_fistulas)} />
                <Row l="Нетримання калу" v={r.fecal_incontinence ?? '—'} />
                <Row l="Інфекційні ускладнення" v={r.infectious_complications || '—'} />
                <Row l="Стероїдозалежність" v={yn(r.steroid_dependence)} />
                <Row l="Стероїдорезистентність" v={yn(r.steroid_resistance)} />
                <Row l="Резистентність до біол. терапії" v={yn(r.advanced_therapy_resistance)} />
                <Row l="Куріння" v={r.smoking_status ? smoking[r.smoking_status] ?? r.smoking_status : '—'} />
            </Box>

            <Box title="Лікування">
                <Row l="Препарати" v={r.treatments.map(t => t.drug === 'OTHER' ? (t.other_drug_name ?? 'Інше') : drug[t.drug] ?? t.drug).join(', ') || '—'} />
                <Row l="Резистентність до" v={[...r.resistant_drugs.map(t => t.drug === 'OTHER' ? 'Інше' : drug[t.drug] ?? t.drug), r.resistant_drugs_other].filter(Boolean).join(', ') || '—'} />
                <Row l="Побічні реакції" v={r.side_effects || '—'} />
            </Box>

            <Box title="Операції">
                <Row l="Операції в анамнезі" v={yn(r.abdominal_surgeries)} />
                {r.surgeries.map(s => (
                    <Row key={s.id} l={d(s.operation_date)} v={[s.operation_name, s.description].filter(Boolean).join(' — ') || 'Операція'} />
                ))}
            </Box>

            <Box title="Лабораторія">
                {r.lab_results.length === 0 && <Row l="Показники" v="—" />}
                {r.lab_results.map(l => (
                    <Row key={l.id} l={`${l.lab_type === 'CRP' ? 'СРБ' : 'Кальпротектин'} (${d(l.result_date)})`}
                         v={`${l.value} ${l.lab_type === 'CRP' ? 'мг/л' : 'мкг/г'}`} />
                ))}
            </Box>
        </div>
    );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
            <h2 className="text-lg font-bold mb-4">{title}</h2>
            <dl className="space-y-2 text-sm">{children}</dl>
        </div>
    );
}
function Row({ l, v }: { l: string; v: string }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-gray-500 shrink-0">{l}</dt>
            <dd className="font-medium text-right">{v}</dd>
        </div>
    );
}