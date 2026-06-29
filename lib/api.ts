const BASE = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

export async function backendFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}
