export interface SyncStats {
  inserted: number;
  updated: number;
}

export interface CompetitionMeta {
  id: number;
  slug: string;
  tier: number;
  isWomen: boolean;
  isFeatured: boolean;
  isMoroccoFocus: boolean;
  displayPriority: number;
  countryCode?: string;
}
