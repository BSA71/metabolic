import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AchievementBadgeMedal } from './AchievementBadgeMedal';
import type { GamificationDashboard } from '../../types/gamification';

export function RecentBadgesCard({ badges }: { badges: GamificationDashboard['recentBadges'] }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-app-text-muted">Recent badges</h2>
      {badges.length === 0 ? (
        <p className="mt-4 text-sm text-app-text-muted">
          Complete your first level to start earning badges.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {badges.map((badge) => (
            <li key={badge.id} className="flex items-center gap-3">
              <AchievementBadgeMedal badgeId={badge.id} name={badge.name} icon={badge.icon} size="sm" earned />
              <div className="min-w-0">
                <p className="font-semibold text-sm">{badge.name}</p>
                <p className="text-xs text-app-text-muted">{badge.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link to="/level-up/badges" className="mt-4 block">
        <Button variant="secondary" className="w-full">
          View all badges
        </Button>
      </Link>
    </Card>
  );
}
