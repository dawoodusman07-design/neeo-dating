import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button, EmptyState, ErrorState, ProfilePhoto, Screen } from '@/ui';
import { useRouter } from 'expo-router';
import { api, type Profile } from '@/data';
import { ageFromDob } from '@/lib/age';
import { useOnboarding } from '@/stores/onboarding';
import { useSession } from '@/stores/session';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { NameLine, ProfileView } from '@/features/profile/ProfileView';

export default function Review() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const draft = useOnboarding();
  const setStatus = useSession((s) => s.setStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  // Never publish (or render ', NaN') from an incomplete draft, e.g. after a deep link or a restored session.
  const missing = !draft.dob ? 'dob' : !draft.firstName.trim() ? 'name' : draft.photos.length < 3 ? 'photos' : draft.prompts.filter((p) => p.answer.trim()).length < 3 ? 'prompts' : !draft.agreementAccepted ? 'agreement' : null;

  const preview: Profile = {
    id: 'me',
    firstName: draft.firstName,
    age: ageFromDob(draft.dob ?? ''),
    pronouns: draft.pronouns || undefined,
    city: draft.city ?? '',
    intention: draft.intention ?? 'long_term',
    verified: draft.verification === 'verified',
    photos: draft.photos.map((p) => ({ id: p.id, uri: p.uri, status: 'pending' })),
    prompts: draft.prompts.map((p, i) => ({ id: String(i), question: p.question, answer: p.answer, voice: p.voiceUri ? { uri: p.voiceUri, durationSec: p.voiceDurationSec ?? 0, waveform: [] } : undefined })),
    basics: [],
    dateIdeas: draft.dateIdeas,
    friendsTakes: [],
  };

  const finish = async () => {
    setLoading(true);
    setError(false);
    try {
      await api.me.completeOnboarding({
        dob: draft.dob!,
        firstName: draft.firstName,
        pronouns: draft.pronouns,
        intention: draft.intention ?? 'long_term',
        photoUris: draft.photos.map((p) => p.uri),
        prompts: preview.prompts.map((p) => ({ question: p.question, answer: p.answer, voice: p.voice })),
        dateIdeas: draft.dateIdeas,
        city: draft.city ?? '',
        gender: draft.gender,
        genderText: draft.genderText || undefined,
        intentionNote: draft.intentionNote || undefined,
        preferences: draft.prefs,
      });
      if (draft.verification === 'verified') await api.me.setVerified();
      draft.reset();
      qc.invalidateQueries();
      setStatus('active');
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (missing)
    return (
      <Screen back scroll={false}>
        <EmptyState icon="info" title={t('onboarding.reviewIncompleteTitle')} body={t('onboarding.reviewIncompleteBody')} action={{ title: t('onboarding.reviewIncompleteAction'), onPress: () => router.replace(`/onboarding/${missing}`) }} />
      </Screen>
    );
  if (error) return <ErrorState title={t('common.genericError')} body={t('states.loadFailed.body')} action={{ title: t('common.retry'), onPress: finish }} />;

  const hero = preview.photos[0];
  return (
    <OnboardingStep step="review" title={t('onboarding.reviewTitle')} body={t('onboarding.reviewBody')} footer={<Button title={t('onboarding.reviewFinish')} onPress={finish} loading={loading} testID="review-finish" />}>
      {hero ? <ProfilePhoto uri={hero.uri} label={t('discover.photoOf', { n: 1, total: preview.photos.length, name: preview.firstName })} pending /> : null}
      <NameLine profile={preview} />
      <ProfileView profile={preview} skipFirstPhoto />
    </OnboardingStep>
  );
}
