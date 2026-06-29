'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot,
} from 'recharts';
import { pro2Severity, CD_THRESHOLDS, UC_THRESHOLDS } from '@/lib/pro2';

export type AssessmentPoint = {
  id: number;
  created_at: string;
  assessment_type: 'CD' | 'UC';
  pro2_score: number | null;
};

export { pro2Severity };

type Props = { assessments: AssessmentPoint[] };

export default function Pro2Chart({ assessments }: Props) {
  const withScore = assessments.filter(a => a.pro2_score !== null);
  if (withScore.length === 0) return null;

  const type = withScore[withScore.length - 1].assessment_type;
  const t = type === 'CD' ? CD_THRESHOLDS : UC_THRESHOLDS;

  const data = withScore.map(a => ({
    date: new Date(a.created_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    score: a.pro2_score,
    type: a.assessment_type,
  }));

  const maxY = Math.max(...data.map(d => d.score ?? 0), t.severe + 4);

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis domain={[0, maxY]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }}
            formatter={(v) => {
              const n = Number(v);
              const sev = pro2Severity(n, type);
              return [`PRO2: ${n} (${sev.label})`, ''] as [string, string];
            }}
          />
          <ReferenceLine y={t.mild}   stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Помірна', fontSize: 10, fill: '#f97316', position: 'insideTopRight' }} />
          <ReferenceLine y={t.severe} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Тяжка',  fontSize: 10, fill: '#ef4444', position: 'insideTopRight' }} />
          <Line
            type="monotone"
            dataKey="score"
            strokeWidth={2}
            stroke="#6366f1"
            dot={(props) => {
              const { cx, cy, payload } = props;
              const color = pro2Severity(payload.score, payload.type).color;
              return <Dot key={`dot-${payload.date}`} cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
            }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
