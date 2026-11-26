import type { Metadata } from 'next';
import { HubRoutePage, hubRouteMetadata, type HubRouteParams } from '@/lib/team/team-hub-route';

const SEGMENT = 'club';

export async function generateMetadata(p: HubRouteParams): Promise<Metadata> {
  return hubRouteMetadata(SEGMENT, p);
}

export default async function Page(p: HubRouteParams) {
  return HubRoutePage(SEGMENT, p);
}
