import { Card } from '../ui/Card';
export function AdminCard({ title, description }: { title: string; description: string }) { return <Card><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm text-slate-500">{description}</p></Card>; }
