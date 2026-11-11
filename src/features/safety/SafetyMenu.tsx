import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ListGroup, ListRow, Sheet, toast } from '@/ui';
import { api, type Profile } from '@/data';
import { useBlock } from '@/data/hooks';

type Props = {
  profile: Profile;
  matchId?: string;
  visible: boolean;
  onClose: () => void;
  extra?: React.ReactNode;
};

/** Report / block / unmatch — available from profile, chat and likes. */
export function SafetyMenu({ profile, matchId, visible, onClose, extra }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const block = useBlock();
  const name = profile.firstName;

  const confirm = (message: string, action: string, run: () => Promise<void>) =>
    Alert.alert(message, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: action, style: 'destructive', onPress: run },
    ]);

  return (
    <Sheet visible={visible} onClose={onClose} title={t('chat.safetySheet')}>
      {extra}
      <ListGroup>
        <ListRow
          icon="report"
          title={t('profile.report')}
          onPress={() => {
            onClose();
            router.push({ pathname: '/report/[id]', params: { id: profile.id, name, matchId: matchId ?? '' } });
          }}
        />
        <ListRow
          icon="block"
          title={t('profile.block')}
          destructive
          onPress={() =>
            confirm(t('chat.blockConfirm', { name }), t('profile.block'), async () => {
              await block.mutateAsync(profile.id);
              onClose();
              toast(`${name} blocked`);
              router.navigate('/discover');
            })
          }
        />
        {matchId ? (
          <ListRow
            icon="unmatch"
            title={t('profile.unmatch')}
            destructive
            onPress={() =>
              confirm(t('chat.unmatchConfirm', { name }), t('profile.unmatch'), async () => {
                await api.matches.unmatch(matchId);
                qc.invalidateQueries({ queryKey: ['matches'] });
                onClose();
                router.navigate('/chats');
              })
            }
          />
        ) : null}
      </ListGroup>
    </Sheet>
  );
}
