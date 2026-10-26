/** FastAPI `detail` is a string, or an array of {msg} objects for 422 — always return readable text. */
export function formatDetail(detail: unknown, fallback = 'Помилка'): string {
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map(d => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : null))
      .filter((m): m is string => !!m)
      .map(m => m.replace(/^Value error, /, ''));
    if (msgs.length) return msgs.join('; ');
  }
  return fallback;
}
