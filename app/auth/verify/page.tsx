import MagicLinkVerify from '@/components/MagicLinkVerify';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <MagicLinkVerify
        token={typeof token === 'string' && token ? token : null}
        title="Вхід в ЗЗК Реєстр"
        description="Натисніть кнопку, щоб увійти в систему."
      />
    </div>
  );
}
