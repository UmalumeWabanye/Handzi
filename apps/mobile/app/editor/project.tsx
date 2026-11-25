import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PORTFOLIO_MAX_PHOTOS } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useCategories, useMyProfile, useRemoveListItem, useSaveListItem } from '@/api/hooks';
import { EditorShell, withProfileLoaded } from '@/features/handyman/EditorShell';
import { Chip, ChipGroup, MonthYearField, PhotoGrid, Text, TextField, space, useToast } from '@/ui';

function ProjectEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useMyProfile();
  const categories = useCategories();
  const existing = data?.profile.portfolio.find((p) => p._id === id);
  const save = useSaveListItem('portfolio');
  const remove = useRemoveListItem('portfolio');
  const toast = useToast();

  const existingCategory = typeof existing?.category === 'string' ? existing.category : existing?.category?._id;
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState<string | undefined>(existingCategory ?? data?.profile.trades[0]?._id);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [completedOn, setCompletedOn] = useState<string | null>(existing?.completedOn ?? null);
  const [location, setLocation] = useState(existing?.location ?? '');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tradeIds = data?.profile.trades.map((t) => t._id) ?? [];
  const options = [...(categories.data ?? [])].sort((a, b) => Number(tradeIds.includes(b._id)) - Number(tradeIds.includes(a._id)));

  const errors = {
    photos: !photos.length ? 'Add at least one photo of the finished work' : null,
    title: !title.trim() ? 'Give the project a short title' : null,
  };

  const submit = async () => {
    setTried(true);
    if (errors.photos || errors.title) return;
    setError(null);
    try {
      await save.mutateAsync({
        id,
        input: { photos, title: title.trim(), category: category ?? null, description: description.trim(), completedOn: completedOn ?? undefined, location: location.trim() },
      });
      toast(id ? 'Project updated' : 'Project added');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <EditorShell
      title={id ? 'Edit project' : 'Add a project'}
      onSave={submit}
      saving={save.isPending}
      error={error}
      onDelete={id ? () => remove.mutateAsync(id) : undefined}
      deleteLabel="this project"
    >
      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Photos
        </Text>
        <PhotoGrid value={photos} onChange={setPhotos} max={PORTFOLIO_MAX_PHOTOS} error={tried ? errors.photos : null} />
      </View>
      <TextField label="Project title" value={title} onChangeText={setTitle} placeholder="e.g. 150L geyser replacement in Randburg" maxLength={100} error={tried ? errors.title : null} />
      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Trade
        </Text>
        <ChipGroup>
          {options.map((c) => (
            <Chip
              key={c._id}
              label={c.name}
              icon={c.icon as keyof typeof Ionicons.glyphMap}
              selected={category === c._id}
              onPress={() => setCategory(category === c._id ? undefined : c._id)}
            />
          ))}
        </ChipGroup>
      </View>
      <TextField
        label="What was the job?"
        optional
        multiline
        value={description}
        onChangeText={setDescription}
        maxLength={1500}
        placeholder="What was the problem, what did you do, and how did it turn out?"
      />
      <MonthYearField label="Completed" optional value={completedOn} onChange={setCompletedOn} />
      <TextField label="Area" optional value={location} onChangeText={setLocation} placeholder="e.g. Randburg" icon="location-outline" maxLength={100} />
    </EditorShell>
  );
}

export default withProfileLoaded(ProjectEditor);
