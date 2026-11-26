'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CompetitionRail, type CompetitionRailProps } from './CompetitionRail';
import { NavIcon } from './icons';
import { mcFont } from './font';
import './match-centre.css';

export interface CompetitionSheetProps {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  rail: CompetitionRailProps;
}

/**
 * The mobile navbar picker's sheet (template: the "PL ▾" button opens the rail in the dialog).
 * A native modal <dialog>: the rest of the page is inert while it is open (focus stays inside),
 * Escape and the backdrop close it, and focus returns to the picker button. Loaded on demand so
 * pages without the picker never ship the rail styles.
 */
export function CompetitionSheet({ open, onClose, onSearch, rail }: CompetitionSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return createPortal(
    <div className={`mc mc-sheet-host ${mcFont.variable}`}>
      <dialog
        ref={ref}
        className="mc-sheet"
        aria-labelledby={titleId}
        onClose={(e) => {
          // React propagates the nested Tournament editions dialog's close event; ignore it.
          if (e.target === e.currentTarget) onClose();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="dialogbar">
          <h2 id={titleId}>{rail.labels.browse}</h2>
          <button
            type="button"
            className="iconbtn"
            aria-label={rail.labels.close}
            onClick={() => ref.current?.close()}
          >
            <NavIcon name="close" />
          </button>
        </div>
        <div
          className="dialogbody"
          // The rail's links navigate client-side now, so the sheet is not torn down by a page
          // load: close it on any link tap (incl. the current competition, which keeps the URL).
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) ref.current?.close();
          }}
        >
          <CompetitionRail {...rail} onSearch={onSearch} />
        </div>
      </dialog>
    </div>,
    document.body,
  );
}
