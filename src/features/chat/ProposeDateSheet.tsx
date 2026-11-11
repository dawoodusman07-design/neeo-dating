import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Chip, Sheet, Text, TextField } from '@/ui';
import type { DateProposal } from '@/data';

type Props = { visible: boolean; ideas: string[]; onClose: () => void; onSend: (p: DateProposal) => void };

export function ProposeDateSheet({ visible, ideas, onClose, onSend }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [idea, setIdea] = useState(ideas[0] ?? '');
  const [when, setWhen] = useState('');
  const [place, setPlace] = useState('');
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('chat.proposeTitle')}>
      <Text variant="caption" color="textMuted">
        {tr('chat.proposeIdea')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
        {ideas.map((i) => (
          <Chip key={i} label={i} icon="dateIdea" selected={idea === i} onPress={() => setIdea(i)} />
        ))}
      </View>
      <TextField label={tr('chat.proposeIdea')} value={idea} onChangeText={setIdea} />
      <TextField label={tr('chat.proposeWhen')} value={when} onChangeText={setWhen} placeholder="Saturday afternoon" />
      <TextField label={tr('chat.proposePlace')} value={place} onChangeText={setPlace} />
      <Button title={tr('chat.proposeSend')} disabled={!idea.trim()} onPress={() => onSend({ idea: idea.trim(), when: when.trim() || undefined, place: place.trim() || undefined, status: 'proposed' })} />
    </Sheet>
  );
}
