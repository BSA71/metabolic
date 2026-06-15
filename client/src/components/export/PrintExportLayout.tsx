import { useEffect, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { BrandMarkIcon } from '../brand/BrandLogo';

export function PrintExportLayout({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  children,
  onPrint,
  printDisabled = false,
  wide = false
}: {
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel?: string;
  children: ReactNode;
  onPrint?: () => void;
  printDisabled?: boolean;
  wide?: boolean;
}) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('print') !== '1' || printDisabled || !onPrint) return;
    const timer = window.setTimeout(() => onPrint(), 400);
    return () => window.clearTimeout(timer);
  }, [searchParams, onPrint, printDisabled]);

  function handlePrint() {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  }

  return (
    <div className="export-page min-h-screen bg-white text-slate-900">
      <div className="export-toolbar border-b border-slate-200 bg-white px-4 py-3 print:hidden">
        <div className={`mx-auto flex items-center justify-between gap-3 ${wide ? 'max-w-[100rem]' : 'max-w-3xl'}`}>
          <Link to={backTo} className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← {backLabel}
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            disabled={printDisabled}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      <article className={`export-content mx-auto px-6 py-8 sm:px-8 ${wide ? 'max-w-[100rem]' : 'max-w-3xl'}`}>
        <header className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <BrandMarkIcon size={28} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Metabolic</p>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        </header>
        <div className="mt-8">{children}</div>
      </article>
    </div>
  );
}
