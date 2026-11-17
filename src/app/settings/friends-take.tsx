import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Icon, ListGroup, ListRow, Screen, Text, TextField, toast, useField } from '@/ui';
import { api, ApiError } from '@/data';
import { shareInvite } from '@/features/invites/shareInvite';
import type { MyFriendsTake } from '@/data/types';

/** Friend's Take: invite -> friend writes it (neeo.app/invite) -> received here -> owner chooses to show it on the profile. */
export default function FriendsTake() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const invites = useQuery({ queryKey: ['invites', 'friends_take'], queryFn: () => api.invites.list('friends_take'), refetchInterval: 2000 });
  const takes = useQuery({ queryKey: ['friendsTakes'], queryFn: () => api.friendsTakes.mine(), refetchInterval: 2000 });
  const name = useField('', (v) => (v.trim().length < 2 ? tr('chaperone.nameRequired') : undefined));
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['invites', 'friends_take'] });
    await qc.invalidateQueries({ queryKey: ['friendsTakes'] });
    await qc.invalidateQueries({ queryKey: ['me'] });
  };
  const invite = async () => {
    if (!name.check()) return;
    setLoading(true);
    try {
      const inv = await api.invites.create('friends_take', { name: name.value });
      name.reset();
      await refresh();
      await shareInvite(tr('friendsTake.shareMessage', { url: inv.url }));
    } catch (e) {
      name.setServerError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  };
  const setShown = async (tk: MyFriendsTake, approved: boolean) => {
    await api.friendsTakes.setApproved(tk.id, approved);
    await refresh();
    toast(approved ? tr('friendsTake.shown') : tr('friendsTake.hidden'));
  };

  const waiting = (invites.data ?? []).filter((i) => i.status === 'sent');
  const list = takes.data ?? [];
  return (
    <Screen title={tr('friendsTake.title')} back>
      <Text color="textMuted">{tr('friendsTake.intro')}</Text>
      {list.length ? (
        <View style={{ gap: t.space[2] }}>
          <Text variant="caption" color="textMuted" accessibilityRole="header">{tr('friendsTake.takesTitle')}</Text>
          {list.map((tk) => (
            <Card key={tk.id} testID={`take-${tk.approved ? 'shown' : 'received'}`}>
              <Text>{`“${tk.text}”`}</Text>
              <Text variant="caption" color="textMuted">{tr('friendsTake.byline', { name: tk.author })}</Text>
              <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
                <Icon name={tk.approved ? 'show' : 'hide'} size={16} color={tk.approved ? t.c.accent : t.c.textMuted} />
                <Text variant="caption" color={tk.approved ? 'accent' : 'textMuted'} style={{ flex: 1 }}>
                  {tk.approved ? tr('friendsTake.shown') : tr('friendsTake.hidden')}
                </Text>
              </View>
              <Button title={tk.approved ? tr('friendsTake.hide') : tr('friendsTake.show')} variant={tk.approved ? 'secondary' : 'primary'} onPress={() => setShown(tk, !tk.approved)} testID={tk.approved ? 'take-hide' : 'take-show'} />
              <Button title={tr('friendsTake.delete')} variant="text" onPress={async () => { await api.friendsTakes.remove(tk.id); await refresh(); }} />
            </Card>
          ))}
        </View>
      ) : null}
      {waiting.length ? (
        <ListGroup title={tr('friendsTake.invitesTitle')}>
          {waiting.map((i) => (
            <ListRow key={i.id} icon="time" title={tr('friendsTake.waiting', { name: i.name })} subtitle={i.url} onPress={() => shareInvite(tr('friendsTake.shareMessage', { url: i.url }))} accessibilityHint={tr('friendsTake.share')} />
          ))}
        </ListGroup>
      ) : null}
      {!list.length && !waiting.length ? <Text color="textMuted">{tr('friendsTake.empty')}</Text> : null}
      <Card>
        <TextField label={tr('friendsTake.friendName')} {...name.props} autoCapitalize="words" autoComplete="off" testID="take-friend-name" />
        <Button title={tr('friendsTake.invite')} onPress={invite} loading={loading} testID="take-invite" />
      </Card>
    </Screen>
  );
}
