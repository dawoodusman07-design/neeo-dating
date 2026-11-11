import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { IconButton, Text } from '@/ui';
import type { VoiceClip } from '@/data';
import { formatDuration } from '@/lib/time';

/** Play button + waveform + duration. */
export function VoicePlayer({ clip, label }: { clip: VoiceClip; label?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const player = useAudioPlayer(clip.uri ? { uri: clip.uri } : null);
  const status = useAudioPlayerStatus(player);
  // Demo clips (no uri) simulate progress so the UI can be reviewed in mock mode.
  const [demoPos, setDemoPos] = useState<number | null>(null);
  const playing = clip.uri ? status.playing : demoPos !== null;
  const position = clip.uri ? status.currentTime : (demoPos ?? 0);
  const progress = clip.durationSec ? Math.min(1, position / clip.durationSec) : 0;

  useEffect(() => {
    if (demoPos === null) return;
    if (demoPos >= clip.durationSec) return setDemoPos(null);
    const id = setTimeout(() => setDemoPos((p) => (p === null ? null : p + 0.25)), 250);
    return () => clearTimeout(id);
  }, [demoPos, clip.durationSec]);

  const toggle = () => {
    if (!clip.uri) return setDemoPos(demoPos === null ? 0 : null);
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const bars = clip.waveform.length ? clip.waveform : Array.from({ length: 32 }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i)));
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], backgroundColor: t.c.tint, borderRadius: t.radius.pill, padding: t.space[2], paddingEnd: t.space[4] }}
    >
      <IconButton icon={playing ? 'pause' : 'play'} label={playing ? tr('profile.pause') : tr('profile.play')} variant="action" size={44} onPress={toggle} />
      <View
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 32 }}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label ?? tr('profile.voicePrompt', { duration: formatDuration(clip.durationSec) })}
        accessibilityValue={{ min: 0, max: Math.round(clip.durationSec), now: Math.round(position) }}
      >
        {bars.map((h, i) => (
          <View key={i} style={{ flex: 1, height: `${Math.round(h * 100)}%`, borderRadius: 2, backgroundColor: i / bars.length <= progress ? t.c.action : t.c.border }} />
        ))}
      </View>
      <Text variant="caption" color="textMuted" style={{ fontVariant: ['tabular-nums'] }}>
        {formatDuration(playing ? clip.durationSec - position : clip.durationSec)}
      </Text>
    </View>
  );
}
