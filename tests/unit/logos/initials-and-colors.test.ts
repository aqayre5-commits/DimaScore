import { describe, it, expect } from 'vitest';
import { logoInitials } from '@/lib/logos/initials';
import { fallbackPalette, logoContrast, NEUTRAL_LIGHT, NEUTRAL_DARK } from '@/lib/logos/colors';
import {
  classifyLogoBytes,
  TEAM_PLACEHOLDER_SHA256,
  TEAM_LOGO_SOON_SHA256,
  TEAM_CAMERA_DARK_SHA256,
  TEAM_SHIELD_OUTLINE_SHA256,
  PLAYER_SILHOUETTE_SHA256,
  COACH_NO_PHOTO_SHA256,
  COACH_SHIELD_OUTLINE_SHA256,
  isKnownPhotoPlaceholderHash,
  isKnownPlaceholderHash,
  usableLogoUrl,
} from '@/lib/logos/status';

describe('logoInitials', () => {
  it('prefers a 2–3 letter Latin team code', () => {
    expect(logoInitials({ code: 'WAC', name: { ar: 'الوداد', en: 'Wydad' } })).toEqual({
      initials: 'WAC',
      source: 'code',
    });
  });

  it('uses Latin name initials when there is no code (Amal Tiznit → AT)', () => {
    expect(logoInitials({ name: { en: 'Amal Tiznit' } })).toEqual({
      initials: 'AT',
      source: 'name-latin',
    });
    expect(logoInitials({ shortName: { en: 'Amal Tiznit' } }).initials).toBe('AT');
  });

  it('prefers the English name for Arabic display names', () => {
    const r = logoInitials({
      name: { ar: 'أمل تزنيت', en: 'Amal Tiznit' },
      locale: 'ar',
    });
    expect(r).toEqual({ initials: 'AT', source: 'name-latin' });
  });

  it('falls back to Arabic initials when no Latin name or code exists', () => {
    const r = logoInitials({ name: { ar: 'أمل تزنيت' }, locale: 'ar' });
    expect(r.source).toBe('arabic-initials');
    expect(r.initials).toBe('أت');
  });

  it('skips FC / Women filler words', () => {
    expect(logoInitials({ name: 'Raja Club Athletic Women' }).initials).toBe('RCA');
  });
});

describe('fallbackPalette', () => {
  it('neutral tokens meet AA for initials in light and dark', () => {
    expect(logoContrast(NEUTRAL_LIGHT.fill, NEUTRAL_LIGHT.ink)).toBeGreaterThanOrEqual(4.5);
    expect(logoContrast(NEUTRAL_DARK.fill, NEUTRAL_DARK.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('picks light initials on a dark club colour', () => {
    const p = fallbackPalette('#1a3c2a');
    expect(logoContrast(p.fill, p.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('usableLogoUrl hides placeholder and missing', () => {
    const url = 'https://media.api-sports.io/football/teams/18753.png';
    expect(usableLogoUrl(url, 'ok')).toBe(url);
    expect(usableLogoUrl(url, 'placeholder')).toBeNull();
    expect(usableLogoUrl(url, 'missing')).toBeNull();
    expect(usableLogoUrl('', 'ok')).toBeNull();
  });

  it('classifies the known camera-graphic hash as placeholder', () => {
    const body = new Uint8Array(29416);
    const r = classifyLogoBytes(200, body, TEAM_PLACEHOLDER_SHA256);
    expect(r.status).toBe('placeholder');
  });

  it('classifies the official-logo-soon disc hash as placeholder', () => {
    const r = classifyLogoBytes(200, new Uint8Array(6746), TEAM_LOGO_SOON_SHA256);
    expect(r.status).toBe('placeholder');
  });

  it('classifies the black-background camera hash as a team placeholder', () => {
    const r = classifyLogoBytes(200, new Uint8Array(90381), TEAM_CAMERA_DARK_SHA256);
    expect(r.status).toBe('placeholder');
  });

  it('classifies the empty outline-shield hash as a team placeholder', () => {
    const r = classifyLogoBytes(200, new Uint8Array(90381), TEAM_SHIELD_OUTLINE_SHA256);
    expect(r.status).toBe('placeholder');
  });

  it('treats the grey player silhouette as a photo placeholder, not a team crest hash', () => {
    expect(isKnownPhotoPlaceholderHash(PLAYER_SILHOUETTE_SHA256)).toBe(true);
    expect(isKnownPlaceholderHash(PLAYER_SILHOUETTE_SHA256)).toBe(false);
    const asLogo = classifyLogoBytes(200, new Uint8Array(5192), PLAYER_SILHOUETTE_SHA256);
    expect(asLogo.status).toBe('ok');
    const asPhoto =
      asLogo.status === 'ok' && isKnownPhotoPlaceholderHash(PLAYER_SILHOUETTE_SHA256)
        ? 'placeholder'
        : asLogo.status;
    expect(asPhoto).toBe('placeholder');
  });

  it('classifies the coach “NO PHOTO YET” and outline-shield graphics as photo placeholders', () => {
    expect(isKnownPhotoPlaceholderHash(COACH_NO_PHOTO_SHA256)).toBe(true);
    expect(isKnownPhotoPlaceholderHash(COACH_SHIELD_OUTLINE_SHA256)).toBe(true);
    expect(isKnownPlaceholderHash(COACH_NO_PHOTO_SHA256)).toBe(false);
  });
});

describe('player initials', () => {
  it('turns abbreviated scorer names into two-letter avatars (Y. Zraa → YZ)', () => {
    expect(logoInitials({ name: 'Y. Zraa' })).toEqual({ initials: 'YZ', source: 'name-latin' });
    expect(logoInitials({ name: 'Z. Essalhi' })).toEqual({ initials: 'ZE', source: 'name-latin' });
  });
});
