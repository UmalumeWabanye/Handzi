import React from 'react';
import { View } from 'react-native';
import type { ChecklistItem } from '@handyconnect/shared';
import { Card, ListRow, ProgressBar, Text, space } from '@/ui';
import type { ProfileSectionKey } from './ProfileView';

const ICONS: Record<ChecklistItem['key'], React.ComponentProps<typeof ListRow>['icon']> = {
  basics: 'person-outline',
  trades: 'construct-outline',
  experience: 'briefcase-outline',
  portfolio: 'images-outline',
  certifications: 'ribbon-outline',
  area: 'location-outline',
  verification: 'shield-checkmark-outline',
};

type Props = { checklist: ChecklistItem[]; onOpen?: (key: ChecklistItem['key']) => void; showDone?: boolean };

export function ProfileStrength({ checklist, onOpen, showDone = true }: Props) {
  const done = checklist.filter((i) => i.done).length;
  const pct = done / checklist.length;
  const items = showDone ? checklist : checklist.filter((i) => !i.done);
  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="subheading">Profile strength</Text>
        <Text variant="label" tone="secondary">
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <ProgressBar value={pct} height={8} />
      <View style={{ marginHorizontal: -space.lg }}>
        {items.map((i) => (
          <ListRow
            key={i.key}
            icon={ICONS[i.key]}
            title={i.label}
            subtitle={i.required ? undefined : 'Optional · adds a badge'}
            done={i.done}
            onPress={onOpen ? () => onOpen(i.key) : undefined}
          />
        ))}
      </View>
    </Card>
  );
}

export const editRouteFor = (key: ChecklistItem['key'] | ProfileSectionKey) => `/edit/${key}` as const;
