export function ProgressRing({
  percent,
  size = 64,
  showLabel = true
}: {
  percent: number;
  size?: number;
  showLabel?: boolean;
}) {
  const stroke = Math.max(3, Math.round(size / 12));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const labelSize = size < 48 ? 9 : 11;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden={!showLabel}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-app-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-brand-green transition-all duration-500"
      />
      {showLabel && (
        <text
          x={size / 2}
          y={size / 2}
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-brand-navy dark:fill-brand-off-white font-semibold rotate-90"
          style={{ fontSize: labelSize, transformOrigin: 'center' }}
        >
          {percent}%
        </text>
      )}
    </svg>
  );
}
