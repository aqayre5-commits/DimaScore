import { usableLogoUrl, type LogoStatus } from './status';
import { isCuratedLogoSrc } from '@/lib/constants/team-logos';

export type FlagImageInput = {
  countryCode?: string | null;
  logoUrl?: string | null;
  isNational?: boolean | null;
  logoStatus?: LogoStatus | null;
};

/** The image URL Flag / TeamMark show (null when they fall back to the SVG mark). */
export function flagImageSrc({
  countryCode,
  logoUrl,
  isNational,
  logoStatus,
}: FlagImageInput): string | null {
  const cc = countryCode?.trim().toLowerCase();
  const crest = usableLogoUrl(logoUrl, logoStatus);
  // Curated same-origin crests win over the country flag so national-team
  // surfaces can show the official badge (group tables, team pages, ticker).
  if (isCuratedLogoSrc(crest)) return crest;
  const asFlag = !!cc && (isNational === true || (isNational == null && !crest));
  return asFlag ? `https://media.api-sports.io/flags/${cc}.svg` : crest;
}
