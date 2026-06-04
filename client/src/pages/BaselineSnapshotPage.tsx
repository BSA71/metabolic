import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BaselineSnapshotForm } from '../components/gamification/BaselineSnapshotForm';
import { CelebrationModal } from '../components/gamification/CelebrationModal';
import type { GamificationCelebration } from '../types/gamification';

export function BaselineSnapshotPage() {
  const [celebration, setCelebration] = useState<GamificationCelebration | null>(null);

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        to="/level-up"
        className="inline-flex items-center gap-1 text-sm text-app-text-muted hover:text-app-text"
      >
        <ArrowLeft size={16} /> Level Up
      </Link>
      <BaselineSnapshotForm
        onSaved={(celebrations) => {
          const level = celebrations.find((c) => c.type === 'level_complete');
          const badge = celebrations.find((c) => c.type === 'badge_earned');
          setCelebration(level ?? badge ?? null);
        }}
      />
      <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />
    </div>
  );
}
