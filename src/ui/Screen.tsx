import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  back?: boolean | (() => void);
  close?: () => void;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode; // fixed bottom area (e.g. primary CTA)
  padded?: boolean;
  edges?: { top?: boolean; bottom?: boolean };
  scrollProps?: ScrollViewProps;
};

/** Safe-area-aware screen with native status bar (never a fake one). */
export function Screen({ title, children, scroll = true, back, close, headerRight, footer, padded = true, edges = { top: true, bottom: true }, scrollProps }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showHeader = title !== undefined || back || close || headerRight;
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding: padded ? t.space[4] : 0, gap: t.space[4], paddingBottom: t.space[8] }}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: padded ? t.space[4] : 0 }}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: edges.top ? insets.top : 0, flex: 1 }}>
        {showHeader ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: t.space[2], gap: t.space[1] }}>
            {back ? (
              <IconButton icon="back" label="Back" onPress={typeof back === 'function' ? back : () => router.back()} />
            ) : (
              <View style={{ width: 8 }} />
            )}
            <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
              {title ?? ''}
            </Text>
            {headerRight}
            {close ? <IconButton icon="close" label="Close" onPress={close} /> : null}
          </View>
        ) : null}
        {body}
        {footer ? (
          <View style={{ paddingHorizontal: t.space[4], paddingTop: t.space[3], paddingBottom: (edges.bottom ? insets.bottom : 0) + t.space[3], gap: t.space[2], backgroundColor: t.c.bg }}>
            {footer}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
