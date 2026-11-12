import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { TabBar } from '@/ui';
import { useLikesReceived, useMatches } from '@/data/hooks';

export default function TabsLayout() {
  const { t } = useTranslation();
  const likes = useLikesReceived();
  const matches = useMatches();
  const unread = (matches.data ?? []).reduce((n, m) => n + m.unread, 0);
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="discover" options={{ title: t('discover.tab') }} />
      <Tabs.Screen name="likes" options={{ title: t('likes.title'), tabBarBadge: likes.data?.length || undefined }} />
      <Tabs.Screen name="chats" options={{ title: t('chats.title'), tabBarBadge: unread || undefined }} />
      <Tabs.Screen name="you" options={{ title: t('you.tab') }} />
    </Tabs>
  );
}
