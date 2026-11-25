import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Certification, Project, WorkHistoryItem } from '@/api/types';
import { assetSource } from '@/lib/assets';
import { EMPLOYMENT_LABELS, duration, monthYear } from '@/lib/format';
import { Badge, Card, ScalePressable, Text, colors, enter, radius, space, useAccent } from '@/ui';

/** Experience entry drawn as a LinkedIn-style timeline node. */
export function WorkTimelineItem({ item, last, onPress, index = 0 }: { item: WorkHistoryItem; last?: boolean; onPress?: () => void; index?: number }) {
  const accent = useAccent();
  const range = `${monthYear(item.startDate)} – ${item.current ? 'Present' : monthYear(item.endDate)}`;
  const body = (
    <View style={styles.timelineRow}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: item.current ? accent.main : colors.surface, borderColor: accent.main }]} />
        {!last && <View style={styles.line} />}
      </View>
      <View style={styles.timelineBody}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {item.title}
          </Text>
          {onPress && <Ionicons name="create-outline" size={18} color={colors.inkTertiary} />}
        </View>
        <Text variant="body" tone="secondary">
          {[item.company || 'Self-employed', EMPLOYMENT_LABELS[item.employmentType]].filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
        </Text>
        <Text variant="caption" tone="tertiary">
          {range} · {duration(item.startDate, item.current ? null : item.endDate)}
          {item.location ? ` · ${item.location}` : ''}
        </Text>
        {item.description ? (
          <Text variant="body" tone="secondary" numberOfLines={onPress ? 2 : undefined} style={{ marginTop: space.xs }}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
  return (
    <Animated.View entering={enter.stagger(index)}>
      {onPress ? (
        <ScalePressable onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`Edit ${item.title}`}>
          {body}
        </ScalePressable>
      ) : (
        body
      )}
    </Animated.View>
  );
}

/** Portfolio project tile: cover photo, title, photo count. */
export function ProjectTile({ project, onPress, index = 0, width = '48%' }: { project: Project; onPress?: () => void; index?: number; width?: `${number}%` | number }) {
  return (
    <Animated.View entering={enter.stagger(index)} style={{ width }}>
      <ScalePressable onPress={onPress} disabled={!onPress} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={project.title}>
        <View style={styles.projectImage}>
          <Image source={assetSource(project.photos[0])} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          {project.photos.length > 1 && (
            <View style={styles.count}>
              <Ionicons name="images" size={12} color="#fff" />
              <Text variant="caption" color="#fff" style={{ fontWeight: '600' }}>
                {project.photos.length}
              </Text>
            </View>
          )}
        </View>
        <Text variant="label" numberOfLines={2} style={{ marginTop: space.sm }}>
          {project.title}
        </Text>
        {(project.completedOn || project.location) && (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {[project.location, project.completedOn && monthYear(project.completedOn)].filter(Boolean).join(' · ')}
          </Text>
        )}
      </ScalePressable>
    </Animated.View>
  );
}

export function CertificationRow({ cert, onPress }: { cert: Pick<Certification, 'name' | 'issuer' | 'issuedAt' | 'expiresAt' | 'verified'>; onPress?: () => void }) {
  const accent = useAccent();
  const expired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
  const content = (
    <>
      <View style={[styles.certIcon, { backgroundColor: accent.softer }]}>
        <Ionicons name="ribbon-outline" size={20} color={accent.main} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{cert.name}</Text>
        <Text variant="caption" tone="tertiary">
          {[cert.issuer, cert.issuedAt && `Issued ${monthYear(cert.issuedAt)}`].filter(Boolean).join(' · ') || 'Certification'}
        </Text>
        <View style={{ flexDirection: 'row', gap: space.xs, marginTop: 2 }}>
          {cert.verified && <Badge label="Verified" tone="success" icon="shield-checkmark" />}
          {expired && <Badge label="Expired" tone="danger" />}
        </View>
      </View>
      {onPress && <Ionicons name="create-outline" size={18} color={colors.inkTertiary} />}
    </>
  );
  return onPress ? (
    <ScalePressable onPress={onPress} style={styles.certRow} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`Edit ${cert.name}`}>
      {content}
    </ScalePressable>
  ) : (
    <View style={styles.certRow}>{content}</View>
  );
}

/** Dashed "add" button used at the end of every editable list. */
export function AddTile({ label, onPress, icon = 'add' }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const accent = useAccent();
  return (
    <ScalePressable
      onPress={onPress}
      style={[styles.add, { borderColor: accent.main, backgroundColor: accent.softer }]}
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo={0.98}
    >
      <Ionicons name={icon} size={20} color={accent.main} />
      <Text variant="bodyStrong" color={accent.dark}>
        {label}
      </Text>
    </ScalePressable>
  );
}

export const ListCard = ({ children }: { children: React.ReactNode }) => <Card style={{ gap: 0 }}>{children}</Card>;

const styles = StyleSheet.create({
  timelineRow: { flexDirection: 'row', gap: space.md },
  rail: { width: 14, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  timelineBody: { flex: 1, gap: 2, paddingBottom: space.xl },
  projectImage: { width: '100%', aspectRatio: 1.1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  count: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  certIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  add: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});
