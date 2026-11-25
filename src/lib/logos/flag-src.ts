import { usableLogoUrl, type LogoStatus } from './status';

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
  const asFlag = !!cc && (isNational === true || (isNational == null && !crest));
  return asFlag ? `https://media.api-sports.io/flags/${cc}.svg` : crest;
}
