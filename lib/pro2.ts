export const CD_THRESHOLDS = { mild: 8, severe: 14 };
export const UC_THRESHOLDS = { mild: 2, severe: 5 };

export function pro2Severity(score: number, type: 'CD' | 'UC') {
  const t = type === 'CD' ? CD_THRESHOLDS : UC_THRESHOLDS;
  if (score < t.mild)   return { label: 'Ремісія', color: '#22c55e', bg: 'bg-green-50',  text: 'text-green-700'  };
  if (score < t.severe) return { label: 'Помірна', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' };
  return                       { label: 'Тяжка',   color: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700'    };
}
