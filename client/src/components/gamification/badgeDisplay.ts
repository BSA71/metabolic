export function resolveBadgeDisplay(status: string) {
  const earned = status === 'EARNED';
  const inProgress = status === 'IN_PROGRESS';
  return { earned, locked: !earned && !inProgress, inProgress };
}
