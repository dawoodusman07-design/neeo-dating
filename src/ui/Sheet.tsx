import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = { visible: boolean; onClose: () => void; title: string; children: React.ReactNode };

/** Bottom sheet built on the native Modal (focus is trapped for screen readers). */
export function Sheet({ visible, onClose, title, children }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', inset: 0, backgroundColor: t.c.overlay }} onPress={onClose} accessibilityRole="button" accessibilityLabel={tr('common.close')} />
        <View
          style={{
            backgroundColor: t.c.bg,
            borderTopLeftRadius: t.radius.lg,
            borderTopRightRadius: t.radius.lg,
            paddingBottom: insets.bottom + t.space[4],
            maxHeight: '90%',
            width: '100%',
            maxWidth: t.size.appMaxWidth, // web: stay inside the phone column
            alignSelf: 'center',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: t.space[2] }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.c.border }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.space[4], paddingTop: t.space[2] }}>
            <Text variant="heading" style={{ flex: 1 }}>
              {title}
            </Text>
            <IconButton icon="close" label={tr('common.close')} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: t.space[4], gap: t.space[3] }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
