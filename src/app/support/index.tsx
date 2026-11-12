import React, { useState } from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, IconButton, ProfilePhoto, RadioGroup, Screen, Text, TextField, fromSchema, useField } from '@/ui';
import { api, supportBodySchema, type SupportTopic } from '@/data';

const TOPICS: SupportTopic[] = ['account', 'safety', 'billing', 'other'];

/** Package 46 (How can we help?) → review → 47 (We have your request). */
export default function Support() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ topic?: SupportTopic }>();
  const [topic, setTopic] = useState<SupportTopic | undefined>(params.topic);
  const [topicError, setTopicError] = useState<string>();
  const body = useField('', fromSchema(supportBodySchema));
  const [attachment, setAttachment] = useState<string>();
  const [reviewing, setReviewing] = useState(false);
  const [sending, setSending] = useState(false);

  const attach = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!r.canceled && r.assets[0]) setAttachment(r.assets[0].uri);
  };

  const send = async () => {
    if (!topic) return;
    setSending(true);
    try {
      const ticket = await api.support.create({ topic, body: body.value.trim(), attachmentUri: attachment });
      qc.invalidateQueries({ queryKey: ['support'] });
      router.replace({ pathname: '/state/[kind]', params: { kind: 'support-received', ref: ticket.reference } });
    } finally {
      setSending(false);
    }
  };

  if (reviewing)
    return (
      <Screen title={tr('support.title')} back={() => setReviewing(false)} footer={<Button title={tr('support.send')} onPress={send} loading={sending} testID="support-send" />}>
        <Text variant="title">{tr('support.reviewTitle')}</Text>
        <Card>
          <Text variant="caption" color="textMuted">{tr('support.topic')}</Text>
          <Text variant="bodyStrong">{topic ? tr(`support.topic_${topic}`) : ''}</Text>
          <Text>{body.value.trim()}</Text>
          {attachment ? <Text variant="caption" color="textMuted">{tr('support.attached')}</Text> : null}
        </Card>
      </Screen>
    );

  return (
    <Screen
      title={tr('support.inboxTitle')}
      back
      footer={
        <Button
          title={tr('support.review')}
          testID="support-review"
          onPress={() => {
            const ok = body.check();
            if (!topic) setTopicError(tr('common.chooseOne'));
            if (ok && topic) setReviewing(true);
          }}
        />
      }
    >
      <Text variant="title">{tr('support.title')}</Text>
      <Text color="textMuted">{tr('support.body')}</Text>
      <RadioGroup
        label={tr('support.topic')}
        value={topic}
        error={topicError}
        onChange={(k) => {
          setTopic(k);
          setTopicError(undefined);
        }}
        options={TOPICS.map((k) => ({ key: k, label: tr(`support.topic_${k}`) }))}
      />
      <TextField label={tr('support.describe')} hint={tr('support.describeHint')} {...body.props} multiline maxLength={2000} autoComplete="off" testID="support-body" />
      {attachment ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
          <View style={{ width: 64 }}>
            <ProfilePhoto uri={attachment} label={tr('support.attached')} aspectRatio={1} radius={t.radius.sm} />
          </View>
          <Text style={{ flex: 1 }}>{tr('support.attached')}</Text>
          <IconButton icon="delete" label={tr('support.removeAttachment')} onPress={() => setAttachment(undefined)} />
        </View>
      ) : topic === 'billing' ? (
        <Button title={tr('support.attach')} icon="addPhoto" variant="secondary" onPress={attach} />
      ) : null}
    </Screen>
  );
}
