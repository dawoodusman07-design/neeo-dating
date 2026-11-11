import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, ErrorState, Icon, ListGroup, ListRow, Screen, Text } from '@/ui';
import { purchases, type Plan } from '@/services/purchases';
import { useSession } from '@/stores/session';
import { links, openLink } from '@/lib/links';

type Row = { label: string; free: string | boolean; plus: string | boolean };

export default function Plus() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const setPlus = useSession((s) => s.setPlus);
  const plansQ = useQuery({ queryKey: ['plans'], queryFn: () => purchases.getPlans() });
  const plans: Plan[] | undefined = plansQ.data;
  const failed = plansQ.isError;
  const [picked, setSelected] = useState<string>();
  const selected = picked ?? plans?.find((x) => x.badge)?.id ?? plans?.[0]?.id;
  const [buying, setBuying] = useState(false);
  const store = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';

  const load = () => plansQ.refetch();

  const rows: Row[] = [
    { label: tr('plus.f1'), free: tr('plus.f1free'), plus: tr('plus.f1plus') },
    { label: tr('plus.f2'), free: true, plus: true },
    { label: tr('plus.f3'), free: false, plus: true },
    { label: tr('plus.f4'), free: false, plus: true },
    { label: tr('plus.f5'), free: false, plus: true },
  ];

  const cell = (v: string | boolean) =>
    typeof v === 'string' ? (
      <Text variant="bodyStrong" align="center">{v}</Text>
    ) : (
      <View accessible accessibilityLabel={v ? tr('plus.included') : tr('plus.notIncluded')} style={{ alignItems: 'center' }}>
        <Icon name={v ? 'check' : 'dash'} color={v ? t.c.success : t.c.textMuted} />
      </View>
    );

  const buy = async () => {
    const plan = plans?.find((p) => p.id === selected);
    if (!plan) return;
    setBuying(true);
    const r = await purchases.purchase(plan);
    setBuying(false);
    if (r.status === 'success') {
      setPlus(true);
      router.replace({ pathname: '/state/[kind]', params: { kind: 'purchase-success' } });
    } else router.push({ pathname: '/state/[kind]', params: { kind: `purchase-${r.status}` } });
  };

  const restore = async () => {
    const r = await purchases.restore().catch(() => 'nothing_to_restore' as const);
    if (r === 'restored') setPlus(true);
    router.push({ pathname: '/state/[kind]', params: { kind: r === 'restored' ? 'restored' : 'restore-none' } });
  };

  return (
    <Screen
      close={() => router.back()}
      footer={
        <>
          <Button title={tr('plus.cta')} onPress={buy} loading={buying} disabled={!selected} testID="plus-continue" />
          <Text variant="small" color="textMuted" align="center">
            {tr('plus.renewal', { store })}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button title={tr('plus.restore')} variant="text" fullWidth={false} onPress={restore} />
            <Button title={tr('plus.terms')} variant="text" fullWidth={false} onPress={() => openLink(links.terms)} />
            <Button title={tr('plus.privacy')} variant="text" fullWidth={false} onPress={() => openLink(links.privacy)} />
          </View>
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: t.space[2] }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={30} color={t.c.brandDeep} />
        </View>
        <Text variant="title" align="center">{tr('plus.title')}</Text>
        <Text color="textMuted" align="center">{tr('plus.sub')}</Text>
      </View>

      <Card style={{ padding: 0, gap: 0 }}>
        <View style={{ flexDirection: 'row', padding: t.space[3], borderBottomWidth: 1, borderBottomColor: t.c.border }} accessibilityRole="header">
          <Text variant="caption" color="textMuted" style={{ flex: 2 }}>{tr('plus.feature')}</Text>
          <Text variant="caption" color="textMuted" style={{ flex: 1 }} align="center">{tr('plus.free')}</Text>
          <Text variant="caption" color="brandDeep" style={{ flex: 1 }} align="center">{tr('plus.plus')}</Text>
        </View>
        {rows.map((r) => (
          <View
            key={r.label}
            accessible
            accessibilityLabel={`${r.label}. ${tr('plus.free')}: ${typeof r.free === 'string' ? r.free : r.free ? tr('plus.included') : tr('plus.notIncluded')}. ${tr('plus.plus')}: ${typeof r.plus === 'string' ? r.plus : tr('plus.included')}`}
            style={{ flexDirection: 'row', alignItems: 'center', padding: t.space[3], borderTopWidth: 1, borderTopColor: t.c.border }}
          >
            <Text style={{ flex: 2 }}>{r.label}</Text>
            <View style={{ flex: 1 }}>{cell(r.free)}</View>
            <View style={{ flex: 1 }}>{cell(r.plus)}</View>
          </View>
        ))}
      </Card>

      {failed ? (
        <ErrorState title={tr('plus.loadFailed')} body={tr('states.offline.body')} action={{ title: tr('common.retry'), onPress: load }} />
      ) : plans ? (
        <ListGroup title={tr('plus.choosePlan')} footer={purchases.isTestStore ? tr('plus.testStore') : undefined}>
          {plans.map((p) => (
            <ListRow key={p.id} title={p.title} subtitle={`${p.priceString} · ${p.periodLabel}`} value={p.badge} selected={selected === p.id} onPress={() => setSelected(p.id)} />
          ))}
        </ListGroup>
      ) : null}
    </Screen>
  );
}
