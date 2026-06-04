import { Flame, Camera, Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import type { GamificationDashboard } from '../../types/gamification';

export function MomentumCard({ momentum }: { momentum: GamificationDashboard['momentum'] }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-app-text-muted">Your momentum</h2>
      <ul className="mt-4 space-y-3">
        <li className="flex items-center gap-3 text-sm">
          <Flame size={20} className="text-brand-gold shrink-0" />
          <span>
            <strong>{momentum.foodLoggingStreak}</strong>-day food logging streak
            {momentum.foodLoggingBest > 0 && (
              <span className="text-app-text-muted"> · Best {momentum.foodLoggingBest}</span>
            )}
          </span>
        </li>
        {momentum.snapshotStreak > 0 && (
          <li className="flex items-center gap-3 text-sm">
            <Camera size={20} className="text-brand-green shrink-0" />
            <span>
              <strong>{momentum.snapshotStreak}</strong>-week snapshot streak
            </span>
          </li>
        )}
        <li className="flex items-center gap-3 text-sm">
          <Trophy size={20} className="text-brand-navy dark:text-brand-green-light shrink-0" />
          <span>
            <strong>{momentum.dailyWinsThisWeek}</strong> Daily Wins this week
          </span>
        </li>
      </ul>
      {momentum.graceDaysAvailable > momentum.graceDaysUsed && (
        <p className="mt-3 text-xs text-app-text-muted">
          Grace days available: {momentum.graceDaysAvailable - momentum.graceDaysUsed}
        </p>
      )}
      {momentum.nextMilestone && (
        <p className="mt-4 rounded-xl bg-brand-green/10 px-3 py-2 text-xs text-brand-navy dark:text-brand-off-white">
          {momentum.nextMilestone}
        </p>
      )}
    </Card>
  );
}
