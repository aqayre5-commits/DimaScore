import type { LogoStatus } from '@/lib/logos/status';
import { TeamMark } from './TeamMark';

interface LogoProps {
  src: string | null | undefined;
  status?: LogoStatus | null;
  size?: number;
  alt?: string;
  className?: string;
  name?: string | Record<string, string> | null;
  code?: string | null;
  shortName?: string | Record<string, string> | null;
  primary?: string | null;
  secondary?: string | null;
}

export function TeamLogo({
  src,
  status,
  size = 20,
  alt = '',
  className = 'object-contain',
  ...rest
}: LogoProps) {
  return (
    <TeamMark
      src={src}
      status={status}
      size={size}
      alt={alt}
      className={className}
      variant="team"
      {...rest}
    />
  );
}

export function CompetitionLogo({
  src,
  status,
  size = 20,
  alt = '',
  className = 'object-contain',
  ...rest
}: LogoProps) {
  return (
    <TeamMark
      src={src}
      status={status}
      size={size}
      alt={alt}
      className={className}
      variant="competition"
      {...rest}
    />
  );
}
