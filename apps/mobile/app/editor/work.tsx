import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { EmploymentType } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useMyProfile, useRemoveListItem, useSaveListItem } from '@/api/hooks';
import { EditorShell, withProfileLoaded } from '@/features/handyman/EditorShell';
import { EMPLOYMENT_LABELS } from '@/lib/format';
import { Chip, ChipGroup, MonthYearField, SwitchRow, Text, TextField, space, useToast } from '@/ui';

function WorkEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useMyProfile();
  const existing = data?.profile.workHistory.find((w) => w._id === id);
  const save = useSaveListItem('work-history');
  const remove = useRemoveListItem('work-history');
  const toast = useToast();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [company, setCompany] = useState(existing?.company ?? '');
  const [type, setType] = useState<EmploymentType>(existing?.employmentType ?? 'self_employed');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [start, setStart] = useState<string | null>(existing?.startDate ?? null);
  const [current, setCurrent] = useState(existing?.current ?? !existing);
  const [end, setEnd] = useState<string | null>(existing?.endDate ?? null);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    title: !title.trim() ? 'Add your job title' : null,
    start: !start ? 'When did you start?' : null,
    end: !current && !end ? 'When did you finish?' : !current && end && start && end < start ? 'End date must be after the start date' : null,
  };

  const submit = async () => {
    setTried(true);
    if (errors.title || errors.start || errors.end) return;
    setError(null);
    try {
      await save.mutateAsync({
        id,
        input: {
          title: title.trim(),
          company: company.trim() || (type === 'self_employed' ? 'Self-employed' : ''),
          employmentType: type,
          location: location.trim(),
          startDate: start!,
          current,
          endDate: current ? undefined : end!,
          description: description.trim(),
        },
      });
      toast(id ? 'Experience updated' : 'Experience added');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <EditorShell
      title={id ? 'Edit experience' : 'Add experience'}
      onSave={submit}
      saving={save.isPending}
      error={error}
      onDelete={id ? () => remove.mutateAsync(id) : undefined}
      deleteLabel="this role"
    >
      <TextField label="Job title" value={title} onChangeText={setTitle} placeholder="e.g. Plumber, Electrician, Site foreman" error={tried ? errors.title : null} maxLength={100} />
      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Type of work
        </Text>
        <ChipGroup>
          {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((t) => (
            <Chip key={t} label={EMPLOYMENT_LABELS[t]} selected={type === t} onPress={() => setType(t)} />
          ))}
        </ChipGroup>
      </View>
      <TextField
        label={type === 'self_employed' ? 'Business name' : 'Company'}
        optional={type === 'self_employed'}
        value={company}
        onChangeText={setCompany}
        placeholder={type === 'self_employed' ? 'e.g. Sipho Plumbing Services' : 'e.g. Joburg Plumbing (Pty) Ltd'}
        maxLength={100}
      />
      <TextField label="Location" optional value={location} onChangeText={setLocation} placeholder="e.g. Soweto, Gauteng" icon="location-outline" maxLength={100} />
      <MonthYearField label="Start date" value={start} onChange={setStart} error={tried ? errors.start : null} />
      <SwitchRow label="I currently work here" value={current} onChange={setCurrent} />
      {!current && <MonthYearField label="End date" value={end} onChange={setEnd} error={tried ? errors.end : null} minYear={start ? new Date(start).getFullYear() : 1970} />}
      <TextField
        label="What did you do?"
        optional
        multiline
        value={description}
        onChangeText={setDescription}
        maxLength={1500}
        placeholder="Types of jobs, responsibilities, notable projects…"
      />
    </EditorShell>
  );
}

export default withProfileLoaded(WorkEditor);
