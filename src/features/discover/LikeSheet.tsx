import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Sheet, Text, TextField, ProfilePhoto } from '@/ui';
import { commentSchema, type LikeTarget, type Profile } from '@/data';

type Props = {
  profile: Profile | null;
  target?: LikeTarget;
  onClose: () => void;
  onSend: (comment: string) => void;
  sending?: boolean;
};

/** Like a specific photo or prompt, with an optional comment. */
export function LikeSheet({ profile, target, onClose, onSend, sending }: Props) {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();
  if (!profile) return null;
  const photo = target?.kind === 'photo' ? profile.photos.find((p) => p.id === target.id) : undefined;
  const prompt = target?.kind === 'prompt' ? profile.prompts.find((p) => p.id === target.id) : undefined;
  return (
    <Sheet visible onClose={onClose} title={t('discover.like', { name: profile.firstName })}>
      {photo ? <ProfilePhoto uri={photo.uri} label={t('discover.likePhoto')} aspectRatio={1} /> : null}
      {prompt ? (
        <Card tone="tint">
          <Text variant="caption" color="textMuted">
            {prompt.question}
          </Text>
          <Text variant="bodyStrong">{prompt.answer}</Text>
        </Card>
      ) : null}
      <TextField
        label={t('discover.commentLabel')}
        hint={t('discover.commentHint')}
        value={comment}
        onChangeText={(v) => {
          setComment(v);
          setError(undefined);
        }}
        error={error}
        multiline
        maxLength={200}
        testID="like-comment"
      />
      <Button
        title={t('discover.sendLike')}
        icon="likes"
        loading={sending}
        testID="send-like"
        onPress={() => {
          const r = commentSchema.safeParse(comment);
          if (!r.success) return setError(r.error.issues[0]?.message);
          onSend(r.data);
        }}
      />
    </Sheet>
  );
}
