/** Production badge artwork — rendered as-is (no medal chrome). */
export const BADGE_ART: Partial<Record<string, string>> = {
  'back-on-track': '/badges/back-on-track.png',
  'baseline-captured': '/badges/baseline-captured.png',
  'consistency-over-perfection': '/badges/consistency-over-perfection.png',
  'daily-check-in-streak': '/badges/daily-check-in-streak.png',
  'first-comparison': '/badges/first-comparison.png',
  'first-day-complete': '/badges/first-day-complete.png',
  'first-step': '/badges/first-step.png',
  'four-week-foundation': '/badges/four-week-foundation.png',
  'getting-consistent': '/badges/getting-consistent.png',
  'honest-tracker': '/badges/honest-tracker.png',
  'hydration-hero-bronze': '/badges/hydration-hero-bronze.png',
  'hydration-hero-gold': '/badges/hydration-hero-gold.png',
  'hydration-hero-silver': '/badges/hydration-hero-silver.png',
  'measurement-streak': '/badges/measurement-streak.png',
  'metabolic-momentum': '/badges/metabolic-momentum.png',
  'momentum-builder': '/badges/momentum-builder.png',
  'pattern-finder': '/badges/pattern-finder.png',
  'progress-in-focus': '/badges/progress-in-focus.png',
  'real-life-logged': '/badges/real-life-logged.png',
  'seven-day-momentum': '/badges/seven-day-momentum.png',
  'snapshot-taken': '/badges/snapshot-taken.png',
  'three-day-momentum': '/badges/three-day-momentum.png',
  'two-week-snapshot-streak': '/badges/two-week-snapshot-streak.png',
  'week-one-complete': '/badges/week-one-complete.png',
};

/** Bump when replacing PNGs so clients skip cached assets. */
const BADGE_ART_VERSION = '4';

export function badgeArtUrl(badgeId: string) {
  const path = BADGE_ART[badgeId];
  if (!path) return null;
  return `${path}?v=${BADGE_ART_VERSION}`;
}
