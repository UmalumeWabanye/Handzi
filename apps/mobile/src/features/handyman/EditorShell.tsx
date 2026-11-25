import React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyProfile } from '@/api/hooks';
import { Banner, Button, FormBody, IconButton, ScreenHeader, Skeleton, colors, space } from '@/ui';

/**
 * Render a form only once the handyman profile is loaded, so its initial state is the saved data
 * (otherwise saving could overwrite fields with blanks, or create a duplicate instead of editing).
 */
export function withProfileLoaded<P extends object>(Component: React.ComponentType<P>, { chrome = true } = {}) {
  return function ProfileLoaded(props: P) {
    const { data, error, refetch } = useMyProfile();
    if (data) return <Component {...props} />;
    const body = (
      <View style={{ padding: space.xl, gap: space.lg }}>
        {error ? (
          <>
            <Banner tone="danger" message="Couldn't load your profile." />
            <Button title="Try again" variant="outline" onPress={() => refetch()} />
          </>
        ) : (
          <>
            <Skeleton height={52} />
            <Skeleton height={52} />
            <Skeleton height={120} />
          </>
        )}
      </View>
    );
    if (!chrome) return body;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <ScreenHeader close />
        {body}
      </SafeAreaView>
    );
  };
}

type Props = {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  error?: string | null;
  onDelete?: () => Promise<unknown>;
  deleteLabel?: string;
};

/** Modal shell shared by the work-history, project and certification editors. */
export function EditorShell({ title, children, onSave, saving, error, onDelete, deleteLabel = 'this entry' }: Props) {
  const insets = useSafeAreaInsets();
  const confirmDelete = () =>
    Alert.alert(`Delete ${deleteLabel}?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await onDelete?.();
          router.back();
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScreenHeader
        close
        title={title}
        right={
          onDelete && <IconButton icon="trash-outline" label={`Delete ${deleteLabel}`} color={colors.danger} onPress={confirmDelete} />
        }
      />
      <FormBody bottomInset={insets.bottom} footer={<Button title="Save" onPress={onSave} loading={saving} />}>
        <Banner tone="danger" message={error} />
        {children}
      </FormBody>
    </SafeAreaView>
  );
}
