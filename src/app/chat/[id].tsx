import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, Chip, EmptyState, Icon, IconButton, ListGroup, ListRow, Text, VerifiedBadge, toast } from '@/ui';
import { api, type Message } from '@/data';
import { useLocal } from '@/stores/local';
import { uid } from '@/lib/id';
import { qk, useMatch, useMessages, useSendMessage } from '@/data/hooks';
import { dayKey, dayLabel, formatDate, formatDuration } from '@/lib/time';
import { textModerator } from '@/services/textModeration';
import { aiAssist } from '@/services/aiAssist';
import { useScreenProtection } from '@/services/screenProtection';
import { useSettings } from '@/stores/settings';
import { useMyId } from '@/stores/useMyId';
import { confirm } from '@/lib/confirm';
import { Bubble } from '@/features/chat/Bubble';
import { ProposeDateSheet } from '@/features/chat/ProposeDateSheet';
import { SafetyMenu } from '@/features/safety/SafetyMenu';

type Row = { type: 'day'; key: string; label: string } | { type: 'msg'; key: string; m: Message };

export default function Conversation() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useMyId();
  const match = useMatch(id);
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const aiOn = useSettings((s) => s.aiAssist);
  const draft = useLocal((s) => s.drafts[id] ?? '');
  const setDraft = useLocal((s) => s.setDraft);
  const [text, setTextState] = useState(draft);
  const setText = (v: string) => {
    setTextState(v);
    setDraft(id, v);
  };
  const [failed, setFailed] = useState<{ id: string; body: string }[]>([]);
  const restoredAnnounced = useRef(false);
  const [safety, setSafety] = useState(false);
  const [propose, setPropose] = useState(false);
  const [starters, setStarters] = useState<string[]>([]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rec = useAudioRecorderState(recorder, 250);

  const onScreenshot = useCallback(() => {
    api.messages.notifyScreenshot(id).then(() => qc.invalidateQueries({ queryKey: qk.messages(id) }));
  }, [id, qc]);
  useScreenProtection(`chat-${id}`, onScreenshot);

  useEffect(() => {
    api.messages.markRead(id).then(() => qc.invalidateQueries({ queryKey: qk.matches }));
  }, [id, qc, messages.data?.length]);

  useEffect(() => {
    if (aiOn && match.data) aiAssist.conversationStarters(match.data.profile).then(setStarters);
  }, [aiOn, match.data]);

  useEffect(() => {
    if (draft && !restoredAnnounced.current) {
      restoredAnnounced.current = true;
      toast(tr('chat.draftRestored'));
    }
  }, [draft, tr]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let last = '';
    for (const m of messages.data ?? []) {
      const k = dayKey(m.createdAt);
      if (k !== last) {
        const l = dayLabel(m.createdAt);
        out.push({ type: 'day', key: `d-${k}`, label: l === 'today' ? tr('chat.today') : l === 'yesterday' ? tr('chat.yesterday') : l });
        last = k;
      }
      out.push({ type: 'msg', key: m.id, m });
    }
    return out.reverse(); // inverted list
  }, [messages.data, tr]);

  if (match.isError) return <EmptyState icon="chats" title={tr('states.not-found.title')} body={tr('states.not-found.body')} action={{ title: tr('common.back'), onPress: () => router.back() }} />;
  if (!match.data) return <View style={{ flex: 1, backgroundColor: t.c.bg }} />;
  const p = match.data.profile;
  const lastMineId = [...(messages.data ?? [])].reverse().find((m) => m.senderId === myId && m.kind !== 'system')?.id;
  const matchedToday = dayLabel(match.data.matchedAt) === 'today';
  const ended = !!match.data.endedAt;

  const doSend = async (body = text) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const check = await textModerator.check(trimmed);
    const go = () => {
      setText('');
      send.mutate(
        { kind: 'text', body: trimmed },
        { onError: () => setFailed((f) => [...f, { id: uid('fail'), body: trimmed }]) },
      );
    };
    if (check.severity === 'block') return toast(tr('chat.blockedSend'), 'error');
    if (check.severity === 'nudge') {
      const sendAnyway = await confirm({ title: tr('chat.nudgeTitle'), message: tr('chat.nudgeBody'), ok: tr('chat.nudgeSend'), cancel: tr('chat.nudgeEdit') });
      return sendAnyway ? go() : undefined;
    }
    go();
  };

  const toggleVoice = async () => {
    if (rec.isRecording) {
      const sec = Math.max(1, Math.round(rec.durationMillis / 1000));
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (recorder.uri) send.mutate({ kind: 'voice', body: 'voice', voice: { uri: recorder.uri, durationSec: sec, waveform: [] } });
      return;
    }
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return toast('Microphone access is off. You can turn it on in Settings.', 'error');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const report = (messageId?: string) => router.push({ pathname: '/report/[id]', params: { id: p.id, name: p.firstName, matchId: id, messageId: messageId ?? '' } });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.space[2], gap: t.space[2], borderBottomWidth: 1, borderBottomColor: t.c.border, paddingBottom: t.space[2] }}>
        <IconButton icon="back" label={tr('common.back')} onPress={() => router.back()} />
        <Avatar uri={p.photos[0]?.uri} name={p.firstName} size={40} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
            <Text variant="bodyStrong" accessibilityRole="header">
              {p.firstName}
            </Text>
            {p.verified ? <VerifiedBadge compact /> : null}
          </View>
          <Text variant="small" color="textMuted">
            {matchedToday ? tr('chat.matchedToday') : tr('chat.matchedOn', { date: formatDate(match.data.matchedAt) })} ·{' '}
            <Text variant="small" color="action" accessibilityRole="link" onPress={() => router.push({ pathname: '/profile/[id]', params: { id: p.id, matchId: id } })}>
              {tr('chat.viewProfile')}
            </Text>
          </Text>
        </View>
        <IconButton icon="safety" label={tr('chat.safety')} onPress={() => setSafety(true)} testID="chat-safety" />
      </View>

      <FlatList
        inverted
        ListHeaderComponent={
          failed.length ? (
            <View style={{ gap: t.space[2], marginTop: t.space[2] }}>
              {failed.map((f) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.body}. ${tr('chat.deliveryFailed')}`}
                  onPress={() => {
                    setFailed((all) => all.filter((x) => x.id !== f.id));
                    send.mutate({ kind: 'text', body: f.body }, { onError: () => setFailed((all) => [...all, f]) });
                  }}
                  style={{ alignSelf: 'flex-end', maxWidth: '80%', gap: t.space[1] }}
                  testID="failed-message"
                >
                  <View style={{ backgroundColor: t.c.tint, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.c.danger, paddingHorizontal: t.space[4], paddingVertical: t.space[3] }}>
                    <Text>{f.body}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: t.space[1], alignItems: 'center', alignSelf: 'flex-end' }}>
                    <Icon name="error" size={14} color={t.c.danger} />
                    <Text variant="small" color="danger">{tr('chat.deliveryFailed')}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : undefined
        }
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ padding: t.space[4], gap: t.space[3] }}
        ListFooterComponent={
          <View style={{ gap: t.space[2], marginBottom: t.space[3] }}>
            <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="time" color={t.c.brandDeep} />
              <Text variant="caption" style={{ flex: 1 }}>
                {tr('chat.noCountdown')}
              </Text>
            </Card>
            {!ended && !(messages.data ?? []).some((m) => m.kind !== 'system') ? (
              <Card>
                <Text variant="heading">{tr('chat.firstMessageTitle', { name: p.firstName })}</Text>
                <Text color="textMuted">{tr('chat.firstMessageBody')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
                  {[...(p.prompts[0] ? [`${p.prompts[0].question}… tell me more?`] : []), ...p.dateIdeas.slice(0, 2).map((d) => `${d}?`)].map((s) => (
                    <Chip key={s} label={s} onPress={() => setText(s)} />
                  ))}
                </View>
              </Card>
            ) : null}
            {p.chaperoneEnabled ? (
              <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="chaperone" color={t.c.brandDeep} />
                <Text variant="caption" style={{ flex: 1 }}>
                  {tr('chat.chaperoneOn')}
                </Text>
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item }) =>
          item.type === 'day' ? (
            <Text variant="small" color="textMuted" align="center" accessibilityRole="header">
              {item.label}
            </Text>
          ) : (
            <Bubble
              m={item.m}
              mine={item.m.senderId === myId}
              showRead={item.m.id === lastMineId}
              theirName={p.firstName}
              onReport={() => report(item.m.id)}
              onSaveDate={() => {
                if (!item.m.dateProposal) return;
                const d = item.m.dateProposal;
                api.saved
                  .savePlan({ id: item.m.id, matchId: id, name: p.firstName, idea: d.idea, when: d.when, place: d.place })
                  .then(() => {
                    qc.invalidateQueries({ queryKey: ['saved', 'plans'] });
                    toast(tr('chat.dateSaved'), 'success');
                  })
                  .catch(() => toast(tr('common.genericError'), 'error'));
              }}
              onRespondDate={async (status) => {
                if (status === 'counter') return setPropose(true);
                await api.messages.respondToDate(item.m.id, status);
                qc.invalidateQueries({ queryKey: qk.messages(id) });
              }}
            />
          )
        }
      />

      {/* Suggestions + composer (or the ended state) */}
      {ended ? (
        <View style={{ borderTopWidth: 1, borderTopColor: t.c.border, padding: t.space[4], paddingBottom: insets.bottom + t.space[4], gap: t.space[2] }}>
          <Text variant="bodyStrong">{tr('chat.endedTitle')}</Text>
          <Text color="textMuted">{tr('chat.endedBody')}</Text>
          <Button title={tr('profile.report')} variant="secondary" onPress={() => report()} />
        </View>
      ) : (
      <View style={{ borderTopWidth: 1, borderTopColor: t.c.border, paddingBottom: insets.bottom + t.space[2], backgroundColor: t.c.bg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.space[2], paddingHorizontal: t.space[4], paddingVertical: t.space[1] }}>
          <Chip label={tr('chat.planDate')} icon="dateIdea" onPress={() => setPropose(true)} />
          <Chip label={rec.isRecording ? `${tr('chat.voiceRecording')} ${formatDuration(rec.durationMillis / 1000)}` : tr('chat.voiceNote')} icon="mic" onPress={toggleVoice} selected={rec.isRecording} />
          <Chip label={tr('chat.sharePhotos')} icon="show" onPress={() => router.push({ pathname: '/share-photos/[matchId]', params: { matchId: id } })} />
          {starters.map((s) => (
            <Chip key={s} label={`${tr('common.aiLabel')}: ${s}`} icon="tip" onPress={() => setText(s)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.space[2], paddingHorizontal: t.space[4] }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={tr('chat.composer', { name: p.firstName })}
            placeholderTextColor={t.c.textMuted}
            accessibilityLabel={tr('chat.composer', { name: p.firstName })}
            autoComplete="off"
            multiline
            maxLength={2000}
            allowFontScaling
            testID="composer"
            style={{ flex: 1, minHeight: 44, maxHeight: 140, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.c.border, backgroundColor: t.c.surface, color: t.c.text, fontFamily: t.font.regular, fontSize: t.type.md, paddingHorizontal: t.space[4], paddingTop: t.space[3], paddingBottom: t.space[3], textAlign: 'auto' }}
          />
          <IconButton icon="send" label={tr('chat.send')} variant="action" size={44} disabled={!text.trim() || send.isPending} onPress={() => doSend()} testID="send" />
        </View>
      </View>
      )}

      <ProposeDateSheet
        visible={propose}
        ideas={p.dateIdeas}
        onClose={() => setPropose(false)}
        onSend={(d) => {
          send.mutate({ kind: 'date_proposal', body: d.idea, dateProposal: d });
          setPropose(false);
        }}
      />
      <SafetyMenu
        profile={p}
        matchId={id}
        visible={safety}
        onClose={() => setSafety(false)}
        extra={
          <ListGroup>
            <ListRow icon="dateIdea" title={tr('chat.dateCheckIn')} onPress={() => { setSafety(false); router.push({ pathname: '/check-in/[matchId]', params: { matchId: id } }); }} />
            <ListRow icon="safety" title={tr('chat.safetyCentre')} onPress={() => { setSafety(false); router.push('/settings/safety'); }} />
          </ListGroup>
        }
      />
    </KeyboardAvoidingView>
  );
}
