import React, { useState } from 'react';
import { View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Text } from '@/ui';
import { formatDuration } from '@/lib/time';

type Props = { onRecorded: (uri: string, durationSec: number) => void; label?: string; maxSec?: number };

/** Record a voice prompt / voice note. Mic permission is requested only on tap. */
export function VoiceRecorder({ onRecorded, label, maxSec = 30 }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 250);
  const [denied, setDenied] = useState(false);

  const start = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return setDenied(true);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setTimeout(() => recorder.isRecording && stop(), maxSec * 1000);
  };
  const stop = async () => {
    const seconds = state.durationMillis / 1000;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    if (recorder.uri) onRecorded(recorder.uri, Math.max(1, Math.round(seconds)));
  };

  return (
    <View style={{ gap: t.space[1] }}>
      <Button
        variant="secondary"
        icon="mic"
        title={state.isRecording ? `${tr('onboarding.recording')} ${formatDuration(state.durationMillis / 1000)}` : (label ?? tr('onboarding.promptVoice'))}
        onPress={state.isRecording ? stop : start}
      />
      {denied ? (
        <Text variant="small" color="danger">
          Microphone access is off. You can turn it on in Settings.
        </Text>
      ) : null}
    </View>
  );
}
