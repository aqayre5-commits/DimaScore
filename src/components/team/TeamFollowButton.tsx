'use client';

import { useTranslations } from 'next-intl';
import { useFollows } from '@/hooks/useFollows';
import { FollowStar } from '@/components/shared/FollowStar';

/** Client follow toggle for a team, for use inside the (server) team page header. */
export function TeamFollowButton({ teamId, teamName }: { teamId: number; teamName: string }) {
  const t = useTranslations('homepage');
  const { followedTeams, toggleTeam } = useFollows();
  const followed = followedTeams.has(teamId);

  return (
    <FollowStar
      active={followed}
      onToggle={() => toggleTeam(teamId)}
      label={followed ? t('unfollowAria', { name: teamName }) : t('followAria', { name: teamName })}
      iconClassName="size-5"
    />
  );
}
