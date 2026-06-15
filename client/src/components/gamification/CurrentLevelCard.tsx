import { Link } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressRing } from './ProgressRing';
import type { GamificationDashboard } from '../../types/gamification';

export function CurrentLevelCard({ level }: { level: NonNullable<GamificationDashboard['currentLevel']> }) {
  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <ProgressRing percent={level.progressPercent} size={72} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">Current level</p>
          <h2 className="mt-1 text-xl font-bold text-brand-navy dark:text-brand-off-white">
            Level {level.number}: {level.name}
          </h2>
          <p className="mt-2 text-sm text-app-text-muted">{level.description}</p>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-app-text-muted">
        {level.tasks.filter((t) => t.complete).length} of {level.tasks.length} tasks complete
      </p>
      <ul className="mt-3 space-y-2">
        {level.tasks.map((task) => (
          <li key={task.key} className="flex items-start gap-2 text-sm">
            {task.complete ? (
              <Check size={18} className="shrink-0 text-brand-green" />
            ) : (
              <Circle size={18} className="shrink-0 text-app-text-muted" />
            )}
            <span className={task.complete ? 'text-app-text-muted line-through' : ''}>{task.label}</span>
          </li>
        ))}
      </ul>

      {level.nextUnlock && (
        <p className="mt-4 text-xs text-app-text-muted">
          Next unlock: <span className="font-medium text-app-text">{level.nextUnlock}</span>
        </p>
      )}

      <Link to={level.ctaPath} className="mt-5 inline-block w-full sm:w-auto">
        <Button className="w-full sm:w-auto">{level.ctaLabel}</Button>
      </Link>
    </Card>
  );
}
