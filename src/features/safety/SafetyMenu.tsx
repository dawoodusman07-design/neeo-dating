import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow, Sheet } from '@/ui';
import type { Profile } from '@/data';

type Props = {
  profile: Profile;
  matchId?: string;
  visible: boolean;
  onClose: () => void;
  extra?: React.ReactNode;
};

/** Report / block / end connection — available from profile, chat and likes. Each opens its own confirmation screen. */
export function SafetyMenu({ profile, matchId, visible, onClose, extra }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={t('chat.safetySheet')}>
      {extra}
      <ListGroup>
        <ListRow icon="report" title={t('profile.report')} onPress={go(() => router.push({ pathname: '/report/[id]', params: { id: profile.id, name: profile.firstName, matchId: matchId ?? '' } }))} />
        <ListRow icon="block" title={t('profile.block')} destructive onPress={go(() => router.push({ pathname: '/block/[id]', params: { id: profile.id, matchId: matchId ?? '' } }))} />
        {matchId ? <ListRow icon="unmatch" title={t('unmatch.cta')} destructive onPress={go(() => router.push({ pathname: '/unmatch/[id]', params: { id: matchId } }))} /> : null}
      </ListGroup>
    </Sheet>
  );
}
