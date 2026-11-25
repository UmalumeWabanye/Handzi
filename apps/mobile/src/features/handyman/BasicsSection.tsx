import React, { useState } from 'react';
import { View } from 'react-native';
import { PROFILE_BIO_MIN } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useMyProfile, useUpdateProfile } from '@/api/hooks';
import { useAuth } from '@/context/AuthContext';
import { AvatarPicker, Banner, Button, Chip, ChipGroup, FormBody, Text, TextField, space, useToast } from '@/ui';
import { SectionProps, submitLabel } from '../shared/types';

export const SA_LANGUAGES = ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Setswana', 'Sepedi', 'Xitsonga', 'siSwati', 'Tshivenda', 'isiNdebele'];

export function BasicsSection({ mode, onDone, intro, bottomInset }: SectionProps) {
  const { user, updateUser } = useAuth();
  const { data } = useMyProfile();
  const update = useUpdateProfile();
  const toast = useToast();
  const p = data?.profile;

  const [headline, setHeadline] = useState(p?.headline ?? '');
  const [bio, setBio] = useState(p?.bio ?? '');
  const [years, setYears] = useState(p?.yearsExperience ? String(p.yearsExperience) : '');
  const [languages, setLanguages] = useState<string[]>(p?.languages?.length ? p.languages : ['English']);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    avatar: !user?.avatar ? 'Add a clear photo of your face. Clients hire people they can see.' : null,
    headline: headline.trim().length < 5 ? 'Add a short headline about what you do' : null,
    bio: bio.trim().length < PROFILE_BIO_MIN ? `Tell clients a bit more (at least ${PROFILE_BIO_MIN} characters)` : null,
  };
  const valid = !errors.avatar && !errors.headline && !errors.bio;

  const toggleLang = (l: string) => setLanguages((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));

  const save = async () => {
    setTried(true);
    if (!valid) return;
    setError(null);
    try {
      await update.mutateAsync({ headline: headline.trim(), bio: bio.trim(), yearsExperience: Number(years) || 0, languages });
      if (mode === 'edit') toast('Profile updated');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <FormBody
      bottomInset={bottomInset}
      footer={<Button title={submitLabel(mode)} onPress={save} loading={update.isPending} />}
    >
      {intro}
      <Banner tone="danger" message={error} />
      <View style={{ gap: space.sm }}>
        <AvatarPicker
          uri={user?.avatar}
          name={`${user?.firstName} ${user?.lastName}`}
          onChange={async (avatar) => {
            try {
              await updateUser({ avatar });
            } catch (e) {
              toast(errorMessage(e), 'error');
            }
          }}
          caption="A friendly, well-lit headshot works best"
        />
        {tried && errors.avatar && (
          <Text variant="caption" tone="danger" center>
            {errors.avatar}
          </Text>
        )}
      </View>
      <TextField
        label="Headline"
        value={headline}
        onChangeText={setHeadline}
        placeholder="e.g. Registered plumber · geysers & leaks"
        maxLength={120}
        error={tried ? errors.headline : null}
        hint="This appears under your name everywhere."
      />
      <TextField
        label="About you"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={2000}
        minLength={PROFILE_BIO_MIN}
        placeholder="What kind of work do you do best? How long have you been in the trade? What can clients expect when they hire you?"
        error={tried ? errors.bio : null}
      />
      <TextField
        label="Years of experience"
        value={years}
        onChangeText={(t) => setYears(t.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
        placeholder="0"
        icon="time-outline"
      />
      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Languages you speak
        </Text>
        <ChipGroup>
          {SA_LANGUAGES.map((l) => (
            <Chip key={l} label={l} selected={languages.includes(l)} onPress={() => toggleLang(l)} />
          ))}
        </ChipGroup>
      </View>
    </FormBody>
  );
}
