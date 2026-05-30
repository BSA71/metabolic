import { clsx } from 'clsx';

function BrandMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="brand-ring" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A6C98A" />
          <stop offset="1" stopColor="#7DA35D" />
        </linearGradient>
        <linearGradient id="brand-m-right" x1="24" y1="14" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A6C98A" />
          <stop offset="1" stopColor="#7DA35D" />
        </linearGradient>
        <clipPath id="brand-m-right-clip">
          <rect x="24" y="12" width="14" height="24" />
        </clipPath>
      </defs>
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="url(#brand-ring)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="112 18"
        transform="rotate(-35 24 24)"
      />
      <path
        d="M14.5 32.5V15.5L19.5 23.5L24 15.5L28.5 23.5V32.5"
        stroke="#1F2933"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-brand-off-white"
      />
      <path
        d="M14.5 32.5V15.5L19.5 23.5L24 15.5L28.5 23.5V32.5"
        stroke="url(#brand-m-right)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath="url(#brand-m-right-clip)"
      />
    </svg>
  );
}

export function BrandLogo({
  className,
  showTagline = false,
  markSize = 40
}: {
  className?: string;
  showTagline?: boolean;
  markSize?: number;
}) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <BrandMark size={markSize} className="shrink-0" />
      <div className="min-w-0">
        <p className="leading-none">
          <span className="text-lg font-semibold tracking-tight text-brand-navy dark:text-brand-off-white sm:text-xl">
            Metabolic
          </span>
          <span className="ml-1 text-lg font-medium text-brand-green dark:text-brand-green-light sm:text-xl">OS</span>
        </p>
        {showTagline && (
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-app-text-muted sm:text-[11px]">
            Powered by the{' '}
            <span className="text-brand-green dark:text-brand-green-light">Master Metabolic Method</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function BrandMarkIcon({ size = 32, className }: { size?: number; className?: string }) {
  return <BrandMark size={size} className={className} />;
}
