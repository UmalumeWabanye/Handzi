import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { JobUrgency } from '@handyconnect/shared';
import { JOB_DESCRIPTION_MIN, JOB_MAX_PHOTOS } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useCategories, useCreateJob } from '@/api/hooks';
import type { GeoPoint, Job } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { Success } from '@/features/onboarding/Success';
import { Wizard, WizardStep } from '@/features/onboarding/Wizard';
import { LocationPicker } from '@/features/shared/LocationPicker';
import { haptic } from '@/lib/haptics';
import { budgetLabel, dayLabel, placeLabel } from '@/lib/format';
import { URGENCY } from '@/lib/jobMeta';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  DayPicker,
  DetailRow,
  FormBody,
  OptionCard,
  PhotoGrid,
  Section,
  Skeleton,
  StepIntro,
  Text,
  TextField,
  enter,
  layout,
  space,
} from '@/ui';

type Draft = {
  category?: string;
  subcategory?: string;
  title: string;
  description: string;
  photos: string[];
  location?: GeoPoint;
  urgency: JobUrgency;
  preferredDate: string | null;
  budgetMin: string;
  budgetMax: string;
};

const digits = (t: string) => t.replace(/\D/g, '').slice(0, 7);

/** Client: describe a job so nearby handymen can quote on it. */
export default function PostJob() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ category?: string }>();
  const categories = useCategories();
  const create = useCreateJob();
  const [draft, setDraft] = useState<Draft>({
    category: params.category,
    title: '',
    description: '',
    photos: [],
    location: user?.location,
    urgency: 'flexible',
    preferredDate: null,
    budgetMin: '',
    budgetMax: '',
  });
  const [posted, setPosted] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState<Record<string, boolean>>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const category = categories.data?.find((c) => c._id === draft.category);

  const dirty = !!(draft.title || draft.description || draft.photos.length);
  const exitFlow = () => {
    if (!dirty || posted) return router.back();
    Alert.alert('Discard this job?', "What you've entered won't be saved.", [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const detailErrors = {
    title: draft.title.trim().length < 5 ? 'Add a short title, e.g. "Leaking geyser"' : null,
    description: draft.description.trim().length < JOB_DESCRIPTION_MIN ? `Describe the problem in a bit more detail (${JOB_DESCRIPTION_MIN}+ characters)` : null,
  };
  const min = draft.budgetMin ? Number(draft.budgetMin) : undefined;
  const max = draft.budgetMax ? Number(draft.budgetMax) : undefined;
  const budgetError = min != null && max != null && max < min ? 'Maximum must be more than the minimum' : null;

  const submit = async () => {
    if (!draft.category || !draft.location) return;
    setError(null);
    try {
      const job = await create.mutateAsync({
        category: draft.category,
        subcategory: draft.subcategory,
        title: draft.title.trim(),
        description: draft.description.trim(),
        photos: draft.photos,
        location: draft.location,
        urgency: draft.urgency,
        preferredDate: draft.preferredDate ?? undefined,
        budget: min != null || max != null ? { min, max } : undefined,
      });
      haptic.success();
      setPosted(job);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  };

  const steps: WizardStep[] = [
    {
      key: 'trade',
      label: 'Trade',
      render: ({ next, bottomInset }) => (
        <FormBody bottomInset={bottomInset} footer={<Button title="Continue" onPress={next} disabled={!draft.category} />}>
          <StepIntro title="What do you need help with?" subtitle="Pick the trade that fits best." />
          {categories.isLoading ? (
            <Skeleton height={300} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.sm }}>
              {categories.data?.map((c) => (
                <OptionCard
                  key={c._id}
                  compact
                  title={c.name}
                  icon={c.icon as keyof typeof Ionicons.glyphMap}
                  selected={draft.category === c._id}
                  onPress={() => setDraft((d) => ({ ...d, category: c._id, subcategory: d.category === c._id ? d.subcategory : undefined }))}
                />
              ))}
            </View>
          )}
          {category && category.subcategories.length > 0 && (
            <Animated.View key={category._id} entering={enter.up()} layout={layout()} style={{ gap: space.sm }}>
              <Text variant="label" tone="secondary">
                More specifically… (optional)
              </Text>
              <ChipGroup>
                {category.subcategories.map((s) => (
                  <Chip key={s} label={s} selected={draft.subcategory === s} onPress={() => set('subcategory', draft.subcategory === s ? undefined : s)} />
                ))}
              </ChipGroup>
            </Animated.View>
          )}
        </FormBody>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: ({ next, bottomInset }) => (
        <FormBody
          bottomInset={bottomInset}
          footer={
            <Button
              title="Continue"
              onPress={() => {
                setTried((t) => ({ ...t, details: true }));
                if (!detailErrors.title && !detailErrors.description) next();
              }}
            />
          }
        >
          <StepIntro title="Describe the job" subtitle="The more detail you give, the more accurate your quotes will be." />
          <TextField
            label="Title"
            value={draft.title}
            onChangeText={(t) => set('title', t)}
            placeholder={draft.subcategory ? `e.g. ${draft.subcategory} — needs fixing` : 'e.g. Geyser leaking through the ceiling'}
            maxLength={120}
            error={tried.details ? detailErrors.title : null}
          />
          <TextField
            label="What's the problem?"
            value={draft.description}
            onChangeText={(t) => set('description', t)}
            multiline
            maxLength={4000}
            minLength={JOB_DESCRIPTION_MIN}
            placeholder="When did it start? What have you noticed? Anything the handyman should know about access, parking or materials?"
            error={tried.details ? detailErrors.description : null}
          />
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="secondary">
              Photos (optional)
            </Text>
            <PhotoGrid kind="job" value={draft.photos} onChange={(p) => set('photos', p)} max={JOB_MAX_PHOTOS} />
            <Text variant="caption" tone="tertiary">
              Photos help handymen quote accurately without a site visit.
            </Text>
          </View>
        </FormBody>
      ),
    },
    {
      key: 'where',
      label: 'Location',
      render: ({ next, bottomInset }) => (
        <FormBody
          bottomInset={bottomInset}
          footer={
            <Button
              title="Continue"
              onPress={() => {
                setTried((t) => ({ ...t, where: true }));
                if (draft.location) next();
              }}
            />
          }
        >
          <StepIntro title="Where is the job?" subtitle="Handymen only see your suburb until you hire someone." />
          <LocationPicker label="Job location" value={draft.location} onChange={(l) => set('location', l)} error={tried.where && !draft.location ? 'Set where the job is' : null} />
        </FormBody>
      ),
    },
    {
      key: 'when',
      label: 'Timing & budget',
      render: ({ next, bottomInset }) => (
        <FormBody bottomInset={bottomInset} footer={<Button title="Review job" onPress={() => !budgetError && next()} disabled={!!budgetError} />}>
          <StepIntro title="When and how much?" subtitle="Both are optional, but they help handymen decide quickly." />
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="secondary">
              How soon?
            </Text>
            {(Object.keys(URGENCY) as JobUrgency[]).map((u) => (
              <OptionCard key={u} title={URGENCY[u].label} subtitle={URGENCY[u].hint} icon={URGENCY[u].icon} selected={draft.urgency === u} onPress={() => set('urgency', u)} />
            ))}
          </View>
          <DayPicker label="Preferred day" optional value={draft.preferredDate} onChange={(d) => set('preferredDate', d)} />
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="secondary">
              Budget (optional)
            </Text>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <TextField label="From" prefix="R" value={draft.budgetMin} onChangeText={(t) => set('budgetMin', digits(t))} keyboardType="number-pad" placeholder="500" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Up to" prefix="R" value={draft.budgetMax} onChangeText={(t) => set('budgetMax', digits(t))} keyboardType="number-pad" placeholder="2 000" error={budgetError} />
              </View>
            </View>
            <Text variant="caption" tone="tertiary">
              Not sure? Leave it blank and let the quotes guide you.
            </Text>
          </View>
        </FormBody>
      ),
    },
    {
      key: 'review',
      label: 'Review',
      render: ({ next, goTo, bottomInset }) => (
        <FormBody
          bottomInset={bottomInset}
          footer={<Button title="Post job" icon="paper-plane-outline" loading={create.isPending} onPress={async () => (await submit()) && next()} />}
        >
          <StepIntro title="Ready to post?" subtitle="Verified handymen near you will be able to see your job and send quotes." />
          <Banner tone="danger" message={error} />
          <Section title={draft.title || 'Untitled job'} action="Edit" onAction={() => goTo('details')}>
            <Text variant="body" tone="secondary" numberOfLines={4}>
              {draft.description}
            </Text>
            {draft.photos.length > 0 && (
              <Text variant="caption" tone="tertiary">
                {draft.photos.length} photo{draft.photos.length > 1 ? 's' : ''} attached
              </Text>
            )}
          </Section>
          <Card style={{ gap: space.xs }}>
            <DetailRow icon="construct-outline" label="Trade" value={[category?.name, draft.subcategory].filter(Boolean).join(' · ')} />
            <DetailRow icon="location-outline" label="Where" value={placeLabel(draft.location) || draft.location?.address || '—'} />
            <DetailRow
              icon="calendar-outline"
              label="When"
              value={[URGENCY[draft.urgency].label, draft.preferredDate && `${dayLabel(draft.preferredDate)} preferred`].filter(Boolean).join(' · ')}
            />
            <DetailRow icon="cash-outline" label="Budget" value={budgetLabel({ min, max })} />
          </Card>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button title="Change trade" variant="outline" size="md" onPress={() => goTo('trade')} style={{ flex: 1 }} />
            <Button title="Change timing" variant="outline" size="md" onPress={() => goTo('when')} style={{ flex: 1 }} />
          </View>
        </FormBody>
      ),
    },
    {
      key: 'done',
      label: 'Posted',
      render: () => (
        <Success
          title="Sharp! Your job is live."
          message="We've shown it to verified handymen in your area. You'll see quotes on the job page as they come in."
          cta="View my job"
          onContinue={() => posted && router.replace({ pathname: '/jobs/[id]', params: { id: posted._id } })}
        />
      ),
    },
  ];

  return <Wizard steps={steps} onExit={exitFlow} exitIcon="close" hideProgressOn={['done']} />;
}
