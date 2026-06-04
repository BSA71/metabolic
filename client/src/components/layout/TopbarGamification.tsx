import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Flame, TrendingUp } from 'lucide-react';
import { badgeArtUrl } from '../gamification/badgeArt';
import { api } from '../../services/api';
import type { GamificationDashboard } from '../../types/gamification';
import { ProgressRing } from '../gamification/ProgressRing';

const TOPBAR_RING_SIZE = 44;
const TOPBAR_MOBILE_ICON = 20;
/** Top bar badge — 25% larger than prior 64px / 36px display */
const TOPBAR_BADGE_SIZE = 80;
const TOPBAR_BADGE_SIZE_MOBILE = 45;

export function TopbarGamification() {
  const [data, setData] = useState<GamificationDashboard | null>(null);

  useEffect(() => {
    api<GamificationDashboard>('/api/gamification/dashboard')
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data?.currentLevel) return null;

  const { currentLevel, momentum, recentBadges } = data;
  const tasksDone = currentLevel.tasks.filter((t) => t.complete).length;
  const tasksTotal = currentLevel.tasks.length;
  const topBadge = recentBadges[0];
  const topBadgeArt = topBadge ? badgeArtUrl(topBadge.id) : null;

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-0 w-full max-w-2xl">
      <Link
        to="/level-up"
        className="flex items-center gap-3 sm:gap-4 rounded-xl border border-app-border bg-app-surface/80 px-3 py-2 sm:px-4 sm:py-2.5 transition hover:border-brand-green/40 hover:bg-app-muted/80 min-w-0 flex-1 sm:flex-none sm:min-w-[280px] md:min-w-[340px]"
        title={currentLevel.name}
      >
        <div className="shrink-0 hidden sm:block">
          <ProgressRing percent={currentLevel.progressPercent} size={TOPBAR_RING_SIZE} />
        </div>
        <TrendingUp
          size={TOPBAR_MOBILE_ICON}
          className="shrink-0 text-brand-green sm:hidden"
          aria-hidden
        />

        <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
          <div className="shrink-0 text-left leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-green">
              Level {currentLevel.number}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-app-text-muted tabular-nums">
              {tasksDone}/{tasksTotal} tasks
            </p>
          </div>

          <p className="min-w-0 flex-1 text-sm sm:text-base font-semibold text-brand-navy dark:text-brand-off-white truncate border-l border-app-border pl-3 sm:pl-5">
            {currentLevel.name}
          </p>
        </div>
      </Link>

      {momentum.foodLoggingStreak > 0 && (
        <div
          className="hidden lg:flex self-center items-center gap-1 text-xs text-app-text-muted shrink-0"
          title="Food logging streak"
        >
          <Flame size={14} className="text-brand-gold" />
          <span className="font-medium tabular-nums">{momentum.foodLoggingStreak}d</span>
        </div>
      )}

      <Link
        to="/level-up/badges"
        className="shrink-0 transition hover:opacity-90"
        title={topBadge?.name ?? 'View badges'}
        aria-label="View badges"
      >
        {topBadgeArt && topBadge ? (
          <img
            src={topBadgeArt}
            alt=""
            className="size-[45px] object-contain sm:size-20"
            width={TOPBAR_BADGE_SIZE}
            height={TOPBAR_BADGE_SIZE}
          />
        ) : (
          <Award className="size-[45px] text-app-text-muted sm:size-20" />
        )}
      </Link>
    </div>
  );
}
