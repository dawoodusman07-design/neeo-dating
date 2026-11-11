import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { Text } from './Text';

const ICONS: Record<string, IconName> = { discover: 'discover', likes: 'likes', chats: 'chats', you: 'you' };

export function TabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: t.c.surface, borderTopWidth: 1, borderTopColor: t.c.border, paddingBottom: insets.bottom, paddingTop: t.space[1] }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const label = (options.title ?? route.name) as string;
        const focused = state.index === index;
        const badge = options.tabBarBadge;
        const onPress = () => {
          if (!focused) navigateToTab(route.key);
        };
        const key = route.name.split('/')[0]!;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${label}, ${badge} new` : label}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, gap: 2 }}
          >
            <View>
              <Icon name={ICONS[key] ?? 'discover'} size={t.size.iconTab} color={focused ? t.c.action : t.c.textMuted} fill={focused && key === 'likes' ? t.c.action : undefined} />
              {badge ? (
                <View style={{ position: 'absolute', top: -2, end: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: t.c.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                  <Text variant="small" color="onAction" style={{ fontSize: 10, lineHeight: 14 }} allowFontScaling={false}>
                    {String(badge)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="small" color={focused ? 'action' : 'textMuted'} style={{ fontFamily: focused ? t.font.semibold : t.font.medium }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
