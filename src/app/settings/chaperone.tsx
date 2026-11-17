import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Icon, ListGroup, ListRow, Screen, Text, TextField, toast, useField, fromSchema } from '@/ui';
import { api, ApiError, phoneSchema } from '@/data';
import { shareInvite } from '@/features/invites/shareInvite';
import { confirm } from '@/lib/confirm';
import type { Invite } from '@/data/types';

const key = ['invites', 'chaperone'];

/** Chaperone invite -> accepted. The chaperone answers from a private link (neeo.app/invite). */
export default function Chaperone() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: key, queryFn: () => api.invites.list('chaperone'), refetchInterval: 2000 });
  const name = useField('', (v) => (v.trim().length < 2 ? tr('chaperone.nameRequired') : undefined));
  const phone = useField('', fromSchema(phoneSchema));
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<Invite>();

  const invite = async () => {
    if (![name.check(), phone.check()].every(Boolean)) return;
    setLoading(true);
    try {
      const inv = await api.invites.create('chaperone', { name: name.value, phone: phone.value.replace(/[\s()-]/g, '') });
      setSent(inv);
      name.reset();
      phone.reset();
      await qc.invalidateQueries({ queryKey: key });
    } catch (e) {
      name.setServerError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (inv: Invite) => {
    if (!(await confirm({ title: tr('chaperone.remove', { name: inv.name }), ok: tr('chaperone.remove', { name: inv.name }), cancel: tr('common.cancel'), destructive: true }))) return;
    await api.invites.revoke(inv.id);
    await qc.invalidateQueries({ queryKey: key });
    await qc.invalidateQueries({ queryKey: ['me'] });
    toast(tr('chaperone.removed', { name: inv.name }));
  };

  const invites = list.data ?? [];
  return (
    <Screen title={tr('chaperone.title')} back>
      <Text color="textMuted">{tr('chaperone.intro')}</Text>
      {sent ? (
        <Card tone="tint" accessibilityLiveRegion="polite" testID="chaperone-sent">
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <Icon name="check" color={t.c.accent} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>{tr('chaperone.sentTitle')}</Text>
          </View>
          <Text color="textMuted">{tr('chaperone.sentBody', { name: sent.name })}</Text>
          <Text selectable variant="caption">{sent.url}</Text>
          <Button title={tr('chaperone.share')} variant="secondary" icon="send" onPress={() => shareInvite(tr('chaperone.shareMessage', { name: sent.name, url: sent.url }))} />
        </Card>
      ) : null}
      <ListGroup title={tr('chaperone.listTitle')}>
        {invites.length ? (
          invites.map((inv) => (
            <ListRow
              key={inv.id}
              icon={inv.status === 'accepted' ? 'check' : 'time'}
              title={inv.name}
              subtitle={inv.status === 'accepted' ? tr('chaperone.accepted') : tr('chaperone.waiting')}
              onPress={() => remove(inv)}
              accessibilityHint={tr('chaperone.remove', { name: inv.name })}
              testID={`chaperone-${inv.status}`}
            />
          ))
        ) : (
          <ListRow title={tr('chaperone.empty')} />
        )}
      </ListGroup>
      <Card>
        <TextField label={tr('chaperone.name')} {...name.props} autoComplete="name" autoCapitalize="words" testID="chaperone-name" />
        <TextField label={tr('chaperone.phone')} {...phone.props} keyboardType="phone-pad" autoComplete="tel" placeholder="+1 416 555 0100" testID="chaperone-phone" />
        <Button title={tr('chaperone.invite')} onPress={invite} loading={loading} testID="chaperone-invite" />
      </Card>
    </Screen>
  );
}
