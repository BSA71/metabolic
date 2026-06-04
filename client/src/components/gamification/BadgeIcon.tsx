import {
  Award,
  CalendarCheck,
  CalendarRange,
  Camera,
  ClipboardList,
  Columns2,
  Droplets,
  Flame,
  Focus,
  Footprints,
  HeartHandshake,
  Image,
  Layers,
  Lock,
  NotebookPen,
  PenLine,
  RefreshCw,
  Repeat,
  Ruler,
  Search,
  Sparkles,
  TrendingUp,
  type LucideIcon
} from 'lucide-react';

const BADGE_ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  'calendar-check': CalendarCheck,
  camera: Camera,
  'columns-2': Columns2,
  flame: Flame,
  'calendar-range': CalendarRange,
  'trending-up': TrendingUp,
  layers: Layers,
  'heart-handshake': HeartHandshake,
  'pen-line': PenLine,
  'notebook-pen': NotebookPen,
  'refresh-cw': RefreshCw,
  image: Image,
  ruler: Ruler,
  focus: Focus,
  search: Search,
  repeat: Repeat,
  sparkles: Sparkles,
  droplets: Droplets,
  'clipboard-list': ClipboardList
};

export function BadgeIcon({
  icon,
  size = 24,
  className,
  locked
}: {
  icon: string;
  size?: number;
  className?: string;
  locked?: boolean;
}) {
  const Icon = locked ? Lock : (BADGE_ICONS[icon] ?? Award);
  return <Icon size={size} className={className} strokeWidth={locked ? 2 : 1.75} />;
}
