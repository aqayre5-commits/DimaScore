import { useTranslations } from 'next-intl';
import { Radio, Globe, Database, MessageCircle } from 'lucide-react';

export function TournamentInfoStrip() {
  const t = useTranslations('tournament');

  const items = [
    { icon: Radio, label: t('infoLiveData'), value: t('infoLiveDataValue') },
    { icon: Globe, label: t('infoTimezone'), value: t('infoTimezoneValue') },
    { icon: Database, label: t('infoDataProvider'), value: t('infoDataProviderValue') },
    { icon: MessageCircle, label: t('infoFeedback'), value: t('infoFeedbackValue') },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 text-xs text-text-tertiary">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <item.icon className="size-3.5 shrink-0" />
          <span className="font-medium text-text-secondary">{item.label}</span>
          <span>{item.value}</span>
        </span>
      ))}
    </div>
  );
}
