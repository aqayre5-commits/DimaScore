'use client';

import { useEffect } from 'react';
import {
  clearNavCompetition,
  setNavCompetition,
  type NavCompetition,
} from './nav-competition-store';

/** Hands the page's competition (and rail data) to the mobile navbar picker. Renders nothing. */
export function NavCompetitionRegister({ current, rail }: NavCompetition) {
  useEffect(() => {
    const value = { current, rail };
    setNavCompetition(value);
    return () => clearNavCompetition(value);
  }, [current, rail]);
  return null;
}
