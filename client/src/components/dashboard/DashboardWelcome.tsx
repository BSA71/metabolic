import { useState } from 'react';
import { pickDashboardCopy } from '../../utils/dashboardCopy';

export function DashboardWelcome({ firstName }: { firstName?: string }) {
  const [copy] = useState(() => pickDashboardCopy(firstName));

  return (
    <div>
      <h1 className="text-3xl font-semibold text-brand-navy dark:text-brand-off-white">{copy.title}</h1>
      <p className="text-app-text-muted mt-1">{copy.subtitle}</p>
    </div>
  );
}
