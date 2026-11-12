import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, ErrorState, Icon, ListGroup, ListRow, Screen, Text } from '@/ui';
import { purchases } from '@/services/purchases';
import { usePlans } from '@/features/membership/useMembership';

type Row = { label: string; free: string | boolean; plus: string | boolean };

/** Package 31 — Plan comparison (with text alternatives for screen readers) + plan choice. */
export default function Compare() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const plans = usePlans();
  const [picked, setPicked] = useState<string>();
  const selected = picked ?? plans.data?.find((p) => p.badge)?.id ?? plans.data?.[0]?.id;

  // Free covers everything needed to meet someone; Plus adds three conveniences.
  const rows: Row[] = [
    { label: tr('plus.f1'), free: true, plus: true },
    { label: tr('plus.f2'), free: true, plus: true },
    { label: tr('plus.f3'), free: true, plus: true },
    { label: tr('plus.f4'), free: true, plus: true },
    { label: tr('plus.f5'), free: false, plus: true },
    { label: tr('plus.f6'), free: false, plus: true },
    { label: tr('plus.f7'), free: false, plus: true },
  ];
  const spoken = (v: string | boolean) => (typeof v === 'string' ? v : v ? tr('plus.included') : tr('plus.notIncluded'));
  const cell = (v: string | boolean) =>
    typeof v === 'string' ? (
      <Text variant="bodyStrong" align="center">{v}</Text>
    ) : (
      <View style={{ alignItems: 'center' }}>
        <Icon name={v ? 'check' : 'dash'} color={v ? t.c.success : t.c.textMuted} />
      </View>
    );

  return (
    <Screen
      title={tr('plus.title')}
      back
      footer={<Button title={tr('plus.reviewPlan')} disabled={!selected} onPress={() => router.push({ pathname: '/plus/review', params: { plan: selected! } })} testID="plus-review" />}
    >
      <Text variant="title">{tr('plus.compareTitle')}</Text>
      <Text color="textMuted">{tr('plus.compareBody')}</Text>
      <Card style={{ padding: 0, gap: 0 }}>
        <View style={{ flexDirection: 'row', padding: t.space[3] }} accessibilityRole="header">
          <Text variant="caption" color="textMuted" style={{ flex: 2 }}>{tr('plus.feature')}</Text>
          <Text variant="caption" color="textMuted" style={{ flex: 1 }} align="center">{tr('plus.free')}</Text>
          <Text variant="caption" color="brandDeep" style={{ flex: 1 }} align="center">{tr('plus.plus')}</Text>
        </View>
        {rows.map((r) => (
          <View
            key={r.label}
            accessible
            accessibilityLabel={`${r.label}. ${tr('plus.free')}: ${spoken(r.free)}. ${tr('plus.plus')}: ${spoken(r.plus)}`}
            style={{ flexDirection: 'row', alignItems: 'center', padding: t.space[3], borderTopWidth: 1, borderTopColor: t.c.border }}
          >
            <Text style={{ flex: 2 }}>{r.label}</Text>
            <View style={{ flex: 1 }}>{cell(r.free)}</View>
            <View style={{ flex: 1 }}>{cell(r.plus)}</View>
          </View>
        ))}
      </Card>
      {plans.isError ? (
        <ErrorState title={tr('plus.loadFailed')} body={tr('states.offline.body')} action={{ title: tr('common.retry'), onPress: () => plans.refetch() }} />
      ) : plans.data ? (
        <ListGroup title={tr('plus.choosePlan')} footer={purchases.isTestStore ? tr('plus.testStore') : undefined}>
          {plans.data.map((p) => (
            <ListRow key={p.id} title={p.title} subtitle={`${p.priceString} · ${p.periodLabel}`} value={p.badge} selected={selected === p.id} onPress={() => setPicked(p.id)} />
          ))}
        </ListGroup>
      ) : null}
    </Screen>
  );
}
