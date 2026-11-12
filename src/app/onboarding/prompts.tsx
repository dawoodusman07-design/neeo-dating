import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, IconButton, ListGroup, ListRow, Sheet, Text, TextField } from '@/ui';
import { promptAnswerSchema } from '@/data';
import { formatDuration } from '@/lib/time';
import { useOnboarding, type DraftPrompt } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep, PROMPT_QUESTIONS } from '@/features/onboarding/steps';
import { VoiceRecorder } from '@/features/voice/VoiceRecorder';

export default function Prompts() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { prompts: saved, patch } = useOnboarding();
  const [prompts, setPrompts] = useState<DraftPrompt[]>(
    saved.length === 3 ? saved : PROMPT_QUESTIONS.slice(0, 3).map((q) => ({ question: q, answer: '' })),
  );
  const [picking, setPicking] = useState<number | null>(null);
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const update = (i: number, p: Partial<DraftPrompt>) => setPrompts((ps) => ps.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const valid = prompts.every((p) => promptAnswerSchema.safeParse(p.answer).success);

  return (
    <OnboardingStep
      step="prompts"
      title={tr('onboarding.promptsTitle')}
      body={tr('onboarding.promptsBody')}
      footer={
        <Button
          title={tr('onboarding.promptsSave')}
          disabled={!valid}
          testID="prompts-continue"
          onPress={() => {
            patch({ prompts });
            router.push(nextStep('prompts'));
          }}
        />
      }
    >
      {prompts.map((p, i) => (
        <Card key={i}>
          <ListRow title={p.question} subtitle={tr('onboarding.promptPick')} onPress={() => setPicking(i)} />
          <TextField
            label={`${tr('onboarding.promptAnswer')}: ${p.question}`}
            value={p.answer}
            onChangeText={(answer) => update(i, { answer })}
            onBlur={() => setTouched((s) => new Set(s).add(i))}
            error={touched.has(i) ? promptAnswerSchema.safeParse(p.answer).error?.issues[0]?.message : undefined}
            multiline
            maxLength={200}
            autoComplete="off"
            testID={`prompt-answer-${i}`}
            hint={tr('common.charCount', { count: p.answer.length, max: 200 })}
          />
          {p.voiceUri ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
              <Text variant="caption" style={{ flex: 1 }}>
                {tr('onboarding.promptVoiceRecorded', { duration: formatDuration(p.voiceDurationSec ?? 0) })}
              </Text>
              <IconButton icon="delete" label={tr('onboarding.promptVoiceRemove')} onPress={() => update(i, { voiceUri: undefined, voiceDurationSec: undefined })} />
            </View>
          ) : (
            <VoiceRecorder onRecorded={(uri, d) => update(i, { voiceUri: uri, voiceDurationSec: d })} />
          )}
        </Card>
      ))}
      <Sheet visible={picking !== null} onClose={() => setPicking(null)} title={tr('onboarding.promptPick')}>
        <ListGroup>
          {PROMPT_QUESTIONS.filter((q) => !prompts.some((p, j) => j !== picking && p.question === q)).map((q) => (
            <ListRow
              key={q}
              title={q}
              selected={picking !== null && prompts[picking]?.question === q}
              onPress={() => {
                if (picking !== null) update(picking, { question: q });
                setPicking(null);
              }}
            />
          ))}
        </ListGroup>
      </Sheet>
    </OnboardingStep>
  );
}
