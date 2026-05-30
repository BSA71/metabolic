import { useState } from 'react';
import { AdminCard } from '../components/admin/AdminCard';
import { FoodReviewQueue } from '../components/admin/FoodReviewQueue';
import { FoodTable } from '../components/admin/FoodTable';
import { UserTable } from '../components/admin/UserTable';

const cards = [
  'Users',
  'Programs',
  'Nutrition Templates',
  'Exercise Templates',
  'Food Database',
  'AI Review Queue',
  'Reports',
  'Settings'
] as const;

type AdminSection = (typeof cards)[number];

const interactiveSections = new Set<AdminSection>(['Users', 'Food Database', 'AI Review Queue']);

export function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection | null>('Users');

  function toggleSection(section: AdminSection) {
    if (!interactiveSections.has(section)) return;
    setActiveSection((current) => (current === section ? null : section));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <AdminCard
            key={card}
            title={card}
            description={`Manage ${card.toLowerCase()} from this admin module.`}
            selected={activeSection === card}
            onClick={interactiveSections.has(card) ? () => toggleSection(card) : undefined}
          />
        ))}
      </div>
      {activeSection === 'Users' && <UserTable />}
      {activeSection === 'Food Database' && <FoodTable />}
      {activeSection === 'AI Review Queue' && <FoodReviewQueue />}
    </div>
  );
}
