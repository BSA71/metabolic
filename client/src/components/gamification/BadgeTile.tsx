import { Card } from '../ui/Card';
import { AchievementBadgeMedal } from './AchievementBadgeMedal';
import { resolveBadgeDisplay } from './badgeDisplay';
import type { UserBadgeView } from '../../types/gamification';

export function BadgeTile({ badge }: { badge: UserBadgeView }) {
  const { earned, locked, inProgress } = resolveBadgeDisplay(badge.status);

  return (
    <Card
      className={`flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-start sm:text-left ${
        earned ? 'border-brand-gold/50 bg-gradient-to-br from-brand-gold/5 to-transparent' : ''
      }`}
    >
      <AchievementBadgeMedal
        badgeId={badge.id}
        name={badge.name}
        icon={badge.icon}
        size="lg"
        status={badge.status}
      />

      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-brand-navy dark:text-brand-off-white">
          {badge.name}
          {badge.tier && (
            <span className="ml-2 text-sm font-normal text-app-text-muted capitalize">
              {badge.tier.toLowerCase()}
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-app-text-muted">{badge.description}</p>
        {inProgress && (
          <p className="mt-3 text-sm font-medium text-brand-green">
            {badge.progress} of {badge.threshold} complete
          </p>
        )}
        {earned && badge.earnedAt && (
          <p className="mt-3 text-xs text-app-text-muted">
            Earned {new Date(badge.earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  );
}
