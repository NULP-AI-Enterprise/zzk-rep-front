import MagicLinkVerify from '@/components/MagicLinkVerify';

// Landing page of the self-assessment reminder e-mail: logs the patient in and opens the questionnaire.
export default async function SelfAssessmentLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <MagicLinkVerify
        token={typeof token === 'string' && token ? token : null}
        title="Самооцінка стану"
        description="Натисніть кнопку, щоб перейти до анкети самооцінки."
        next="/patient/self-assessment"
      />
    </div>
  );
}
