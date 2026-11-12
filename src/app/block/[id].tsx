import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBlock, useProfile } from '@/data/hooks';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';

/** Package 28 — Block confirmation. */
export default function BlockConfirm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, matchId } = useLocalSearchParams<{ id: string; matchId?: string }>();
  const profile = useProfile(id);
  const block = useBlock();
  const name = profile.data?.firstName ?? '';
  return (
    <ConfirmScreen
      icon="block"
      destructive
      avatar={{ uri: profile.data?.photos[0]?.uri, name: name || '?' }}
      title={t('block.title', { name })}
      lines={sentences(t('block.body'))}
      cta={t('block.cta', { name })}
      testID="block-confirm"
      secondary={{ title: t('block.alsoReport', { name }), onPress: () => router.replace({ pathname: '/report/[id]', params: { id, name, matchId: matchId ?? '' } }) }}
      onConfirm={async () => {
        await block.mutateAsync(id);
        router.dismissAll();
        router.replace({ pathname: '/state/[kind]', params: { kind: 'blocked', name } });
      }}
    />
  );
}
