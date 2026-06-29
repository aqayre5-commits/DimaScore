import { cn } from '@/lib/utils';

interface FormPillsProps {
  /** Form string from the standings feed (oldest → newest), e.g. "WWDLW". */
  form: string | null;
  /** Localized W / D / L labels for the per-pill title tooltip. */
  formLabels: { W: string; D: string; L: string };
  /** How many results to show (from the end of the string). Default 5. */
  count?: number;
}

/**
 * Compact color-coded form pills — green (W) / zinc (D) / red (L). Shared across the
 * cup standings table (GroupTable), the mini standings preview, and the league standings
 * table. The letter is deliberately omitted; color carries the meaning, the localized
 * label sits in the title attribute for hover + screen readers.
 */
export function FormPills({ form, formLabels, count = 5 }: FormPillsProps) {
  if (!form) return null;
  const chars = form.split('').slice(-count);

  return (
    <div className="inline-flex gap-0.5">
      {chars.map((c, i) => (
        <span
          key={i}
          className={cn(
            'inline-block size-3 rounded-sm',
            c === 'W' && 'bg-emerald-500',
            c === 'D' && 'bg-zinc-500',
            c === 'L' && 'bg-red-500',
          )}
          title={c === 'W' ? formLabels.W : c === 'D' ? formLabels.D : formLabels.L}
        />
      ))}
    </div>
  );
}
