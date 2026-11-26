/**
 * Public team-page slugs: a unique team is addressed by the bare name (`arsenal`),
 * not the stored `arsenal-42`. When two teams of the same kind would share a bare
 * name, we do not invent a disambiguation scheme — those teams keep the stored
 * id-slug until a rule is chosen.
 */
import { parseTrailingId } from '@/lib/seo/entity-slug';

export function bareTeamSlug(storedSlug: string): string {
  const id = parseTrailingId(storedSlug);
  if (id == null) return storedSlug;
  const cut = storedSlug.length - String(id).length - 1;
  const bare = cut > 0 ? storedSlug.slice(0, cut) : '';
  return bare || storedSlug;
}

/** Collision key: bare name plus club vs national (the two kinds have different URL prefixes). */
export function bareCollisionKey(bare: string, isNational: boolean): string {
  return `${isNational ? 'n' : 'c'}:${bare}`;
}

export function publicTeamSlug(
  storedSlug: string,
  isNational: boolean,
  colliding: ReadonlySet<string>,
): string {
  const bare = bareTeamSlug(storedSlug);
  if (!bare || colliding.has(bareCollisionKey(bare, isNational))) return storedSlug;
  return bare;
}
