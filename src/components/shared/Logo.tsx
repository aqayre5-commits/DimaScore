import Image from 'next/image';

interface LogoProps {
  src: string | null | undefined;
  size?: number;
  alt?: string;
  className?: string;
}

export function TeamLogo({ src, size = 20, alt = '', className = 'object-contain' }: LogoProps) {
  if (!src) return null;
  return <Image src={src} alt={alt} width={size} height={size} className={className} />;
}

export function CompetitionLogo({
  src,
  size = 20,
  alt = '',
  className = 'object-contain',
}: LogoProps) {
  if (!src) return null;
  return <Image src={src} alt={alt} width={size} height={size} className={className} />;
}
