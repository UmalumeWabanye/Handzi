import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { HandymanProfile, PublicHandyman, PublicReview, ServiceCard as ServiceCardT, User } from '@/api/types';
import { ServiceCard } from '@/features/services/ServiceCard';
import { monthYear, placeLabel, plural, rand, timeAgo } from '@/lib/format';
import { Avatar, Badge, Card, Chip, ChipRow, EmptyState, ScalePressable, Section, StarRating, Text, colors, enter as enterPreset, radius, space, useAccent } from '@/ui';
import { CertificationRow, ProjectTile, WorkTimelineItem } from './ProfileBlocks';

export type ProfileSectionKey = 'basics' | 'trades' | 'experience' | 'portfolio' | 'certifications' | 'area';

type Props = {
  h: PublicHandyman;
  onProjectPress?: (projectId: string) => void;
  onEdit?: (section: ProfileSectionKey) => void; // shows "Edit" on each section (own profile)
  pendingVerification?: boolean;
  reviews?: PublicReview[];
  services?: ServiceCardT[];
  onServicePress?: (id: string) => void;
};

/** Convert the owner's full profile into the public shape so they can preview exactly what clients see. */
export function toPublicShape(p: HandymanProfile, user: User): PublicHandyman {
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    memberSince: user.createdAt,
    headline: p.headline,
    bio: p.bio,
    trades: p.trades,
    skills: p.skills,
    languages: p.languages,
    yearsExperience: p.yearsExperience,
    hourlyRate: p.hourlyRate,
    callOutFee: p.callOutFee,
    serviceRadiusKm: p.serviceRadiusKm,
    place: p.serviceArea ? { suburb: p.serviceArea.suburb, city: p.serviceArea.city, province: p.serviceArea.province } : null,
    workHistory: [...p.workHistory].sort((a, b) => Number(b.current) - Number(a.current) || +new Date(b.startDate) - +new Date(a.startDate)),
    portfolio: p.portfolio,
    certifications: p.certifications,
    stats: p.stats,
    verified: p.verification.status === 'verified',
    available: p.available,
    published: !!p.onboardingCompletedAt,
  };
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.stat}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon && <Ionicons name={icon} size={16} color={colors.star} />}
        <Text variant="heading">{value}</Text>
      </View>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
    </View>
  );
}

export function ProfileView({ h, onProjectPress, onEdit, pendingVerification, reviews, services, onServicePress }: Props) {
  const accent = useAccent();
  const [expanded, setExpanded] = useState(false);
  const name = `${h.firstName} ${h.lastName}`;
  const place = placeLabel(h.place);
  const edit = (k: ProfileSectionKey) => (onEdit ? { action: 'Edit', onAction: () => onEdit(k) } : {});
  const enter = (i: number) => enterPreset.stagger(i);

  return (
    <View style={{ gap: space.xxl }}>
      {/* Header */}
      <Animated.View entering={enter(0)}>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <View style={[styles.cover, { backgroundColor: accent.soft }]}>
            <View style={[styles.coverShape, { backgroundColor: accent.main, opacity: 0.12 }]} />
          </View>
          <View style={styles.headerBody}>
            <View style={styles.avatarWrap}>
              <Avatar uri={h.avatar} name={name} size={96} ring verified={h.verified} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Text variant="title" style={{ flexShrink: 1 }}>
                {name}
              </Text>
            </View>
            {h.headline ? (
              <Text variant="body" tone="secondary">
                {h.headline}
              </Text>
            ) : null}
            <View style={styles.badges}>
              {h.verified ? (
                <Badge label="ID verified" tone="success" icon="shield-checkmark" />
              ) : pendingVerification ? (
                <Badge label="Verification pending" tone="warning" icon="time-outline" />
              ) : null}
              {h.yearsExperience > 0 && <Badge label={`${h.yearsExperience}+ yrs experience`} tone="accent" icon="hammer-outline" />}
              {!h.available && <Badge label="Fully booked" tone="neutral" />}
            </View>
            {(place || h.serviceRadiusKm) && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={15} color={colors.inkTertiary} />
                <Text variant="caption" tone="tertiary">
                  {place ? `${place} · ` : ''}works within {h.serviceRadiusKm} km
                </Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={15} color={colors.inkTertiary} />
              <Text variant="caption" tone="tertiary">
                On Handzi since {monthYear(h.memberSince)}
              </Text>
            </View>
            <View style={styles.stats}>
              <Stat value={h.stats.reviewCount ? h.stats.averageRating.toFixed(1) : '–'} label={h.stats.reviewCount ? plural(h.stats.reviewCount, 'review') : 'No reviews yet'} icon="star" />
              <View style={styles.statDivider} />
              <Stat value={String(h.stats.jobsCompleted)} label="Jobs done" />
              <View style={styles.statDivider} />
              <Stat value={String(h.portfolio.length)} label={h.portfolio.length === 1 ? 'Project' : 'Projects'} />
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Rates */}
      {(h.hourlyRate || onEdit) && (
        <Animated.View entering={enter(1)}>
          <Section title="Rates" {...edit('area')}>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Card style={styles.rate}>
                <Text variant="caption" tone="tertiary">
                  Hourly rate
                </Text>
                <Text variant="heading">{h.hourlyRate ? `${rand(h.hourlyRate)}/hr` : '—'}</Text>
              </Card>
              <Card style={styles.rate}>
                <Text variant="caption" tone="tertiary">
                  Call-out fee
                </Text>
                <Text variant="heading">{h.callOutFee ? rand(h.callOutFee) : 'None'}</Text>
              </Card>
            </View>
          </Section>
        </Animated.View>
      )}

      {/* About */}
      <Animated.View entering={enter(2)}>
        <Section title="About" {...edit('basics')}>
          {h.bio ? (
            <ScalePressable onPress={() => setExpanded((e) => !e)} scaleTo={1} accessibilityRole="button" accessibilityHint={expanded ? 'Show less' : 'Show full text'}>
              <Text variant="body" tone="secondary" numberOfLines={expanded ? undefined : 5}>
                {h.bio}
              </Text>
              {h.bio.length > 240 && (
                <Text variant="label" color={accent.main} style={{ marginTop: space.xs }}>
                  {expanded ? 'Show less' : 'Read more'}
                </Text>
              )}
            </ScalePressable>
          ) : (
            <Text variant="body" tone="tertiary">
              No description yet.
            </Text>
          )}
          {h.languages.length > 0 && (
            <View style={styles.metaRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.inkTertiary} />
              <Text variant="caption" tone="tertiary">
                Speaks {h.languages.join(', ')}
              </Text>
            </View>
          )}
        </Section>
      </Animated.View>

      {/* Trades & skills */}
      <Animated.View entering={enter(3)}>
        <Section title="Trades & skills" {...edit('trades')}>
          <ChipRow>
            {h.trades.map((t) => (
              <Chip key={t._id} label={t.name} icon={t.icon as keyof typeof Ionicons.glyphMap} />
            ))}
          </ChipRow>
          {h.skills.length > 0 && (
            <ChipRow>
              {h.skills.map((s) => (
                <Chip key={s} label={s} size="sm" />
              ))}
            </ChipRow>
          )}
        </Section>
      </Animated.View>

      {/* Service packages */}
      {services && services.length > 0 && (
        <Animated.View entering={enter(4)}>
          <Section title="Services" subtitle="Book a set-price package">
            <View style={{ gap: space.sm }}>
              {services.map((s, i) => (
                <ServiceCard key={s._id} s={s} index={i} showHandyman={false} showStatus={!!onEdit} onPress={() => onServicePress?.(s._id)} />
              ))}
            </View>
          </Section>
        </Animated.View>
      )}

      {/* Portfolio */}
      <Animated.View entering={enter(4)}>
        <Section title="Proof of work" subtitle={h.portfolio.length ? plural(h.portfolio.length, 'project') : undefined} {...edit('portfolio')}>
          {h.portfolio.length ? (
            <View style={styles.grid}>
              {h.portfolio.map((p, i) => (
                <ProjectTile key={p._id} project={p} index={i} onPress={onProjectPress ? () => onProjectPress(p._id) : undefined} />
              ))}
            </View>
          ) : (
            <EmptyState compact icon="images-outline" title="No projects yet" />
          )}
        </Section>
      </Animated.View>

      {/* Experience */}
      <Animated.View entering={enter(5)}>
        <Section title="Experience" {...edit('experience')}>
          {h.workHistory.length ? (
            <Card style={{ paddingBottom: 0 }}>
              {h.workHistory.map((w, i) => (
                <WorkTimelineItem key={w._id} item={w} last={i === h.workHistory.length - 1} />
              ))}
            </Card>
          ) : (
            <Text variant="body" tone="tertiary">
              No experience added yet.
            </Text>
          )}
        </Section>
      </Animated.View>

      {/* Certifications */}
      {(h.certifications.length > 0 || onEdit) && (
        <Animated.View entering={enter(6)}>
          <Section title="Licences & certifications" {...edit('certifications')}>
            {h.certifications.length ? (
              <Card style={{ gap: space.xs }}>
                {h.certifications.map((c) => (
                  <CertificationRow key={c._id} cert={c} />
                ))}
              </Card>
            ) : (
              <Text variant="body" tone="tertiary">
                None added.
              </Text>
            )}
          </Section>
        </Animated.View>
      )}

      {/* Reviews */}
      <Animated.View entering={enter(7)}>
        <Section title="Reviews" subtitle={h.stats.reviewCount ? `${h.stats.averageRating.toFixed(1)} average from ${plural(h.stats.reviewCount, 'review')}` : undefined}>
          {reviews?.length ? (
            <View style={{ gap: space.sm }}>
              {reviews.map((r) => (
                <Card key={r._id} style={{ gap: space.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Avatar uri={r.reviewer?.avatar} name={r.reviewer?.firstName ?? 'Client'} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{r.reviewer?.firstName ?? 'Client'}</Text>
                      <Text variant="caption" tone="tertiary" numberOfLines={1}>
                        {[r.jobTitle, timeAgo(r.createdAt)].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <StarRating value={r.rating} size={14} />
                  </View>
                  {r.text ? (
                    <Text variant="body" tone="secondary">
                      {r.text}
                    </Text>
                  ) : null}
                </Card>
              ))}
            </View>
          ) : (
            <Card>
              <EmptyState compact icon="star-outline" title="No reviews yet" text={`Reviews from clients will appear here after ${h.firstName} completes jobs on Handzi.`} />
            </Card>
          )}
        </Section>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { height: 96, overflow: 'hidden' },
  coverShape: { position: 'absolute', width: 240, height: 240, borderRadius: 120, right: -60, top: -120 },
  headerBody: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.sm },
  avatarWrap: { marginTop: -52, marginBottom: space.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  stats: {
    flexDirection: 'row',
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  rate: { flex: 1, gap: 2, borderRadius: radius.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.lg },
});
