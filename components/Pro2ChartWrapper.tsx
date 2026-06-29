'use client';

import dynamic from 'next/dynamic';
import type { AssessmentPoint } from './Pro2Chart';

const Pro2Chart = dynamic(() => import('./Pro2Chart'), { ssr: false });

export default function Pro2ChartWrapper({ assessments }: { assessments: AssessmentPoint[] }) {
  return <Pro2Chart assessments={assessments} />;
}
