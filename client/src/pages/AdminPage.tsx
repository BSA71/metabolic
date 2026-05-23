import { AdminCard } from '../components/admin/AdminCard';
import { FoodReviewQueue } from '../components/admin/FoodReviewQueue';
import { UserTable } from '../components/admin/UserTable';

const cards = ['Users', 'Programs', 'Nutrition Templates', 'Exercise Templates', 'Food Database', 'AI Review Queue', 'Reports', 'Settings'];

export function AdminPage() {
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Admin</h1><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <AdminCard key={card} title={card} description={`Manage ${card.toLowerCase()} from this admin module.`} />)}</div><UserTable /><FoodReviewQueue /></div>;
}
