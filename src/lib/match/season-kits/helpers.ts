import type { KitPalette } from '../kit-colours';

/** One flat shirt palette; the border matches the number unless a source says otherwise. */
export function k(primary: string, number: string, border: string = number): KitPalette {
  return { primary, number, border };
}
