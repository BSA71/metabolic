import { clsx } from 'clsx';
import { Card } from '../ui/Card';

type Props = {
  title: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
};

export function AdminCard({ title, description, selected, onClick }: Props) {
  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={clsx(
        onClick && 'cursor-pointer transition hover:border-slate-300 hover:bg-slate-50',
        selected && 'border-slate-900 ring-1 ring-slate-900'
      )}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Card>
  );
}
