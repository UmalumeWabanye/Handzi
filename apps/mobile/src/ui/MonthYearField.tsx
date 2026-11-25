import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONTH_NAMES, monthYear } from '@/lib/format';
import { Button } from './Button';
import { ScalePressable } from './Pressable';
import { Sheet } from './Sheet';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, radius, space } from './theme';

type Props = {
  label: string;
  value?: string | null; // ISO date
  onChange: (iso: string | null) => void;
  optional?: boolean;
  error?: string | null;
  minYear?: number;
  allowFuture?: boolean;
};

/** Month + year picker (work history, certifications, projects). Day precision isn't useful here. */
export function MonthYearField({ label, value, onChange, optional, error, minYear = 1970, allowFuture }: Props) {
  const accent = useAccent();
  const now = new Date();
  const maxYear = now.getFullYear() + (allowFuture ? 15 : 0);
  const current = value ? new Date(value) : null;
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(current?.getFullYear() ?? now.getFullYear());
  const [month, setMonth] = useState(current?.getMonth() ?? now.getMonth());

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const isFuture = (m: number) => !allowFuture && (year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth()));

  const confirm = () => {
    onChange(new Date(Date.UTC(year, month, 1)).toISOString());
    setOpen(false);
  };

  return (
    <View style={{ gap: space.xs + 2 }}>
      <View style={styles.labelRow}>
        <Text variant="label" tone="secondary">
          {label}
        </Text>
        {optional && (
          <Text variant="caption" tone="tertiary">
            Optional
          </Text>
        )}
      </View>
      <ScalePressable
        onPress={() => setOpen(true)}
        style={[styles.field, error ? { borderColor: colors.danger } : null]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? monthYear(value) : 'not set'}`}
        scaleTo={0.99}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.inkTertiary} />
        <Text variant="body" tone={value ? 'primary' : 'tertiary'} style={{ flex: 1 }}>
          {value ? monthYear(value) : 'Select month and year'}
        </Text>
        {value && optional && (
          <ScalePressable onPress={() => onChange(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Clear ${label}`}>
            <Ionicons name="close-circle" size={18} color={colors.inkDisabled} />
          </ScalePressable>
        )}
      </ScalePressable>
      {error && (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {years.map((y) => (
            <ScalePressable
              key={y}
              onPress={() => setYear(y)}
              style={[styles.year, y === year && { backgroundColor: accent.main, borderColor: accent.main }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: y === year }}
            >
              <Text variant="label" color={y === year ? '#fff' : colors.ink}>
                {y}
              </Text>
            </ScalePressable>
          ))}
        </ScrollView>
        <View style={styles.months}>
          {MONTH_NAMES.map((m, i) => {
            const disabled = isFuture(i);
            const selected = i === month;
            return (
              <ScalePressable
                key={m}
                disabled={disabled}
                onPress={() => setMonth(i)}
                style={[styles.month, selected && { backgroundColor: accent.softer, borderColor: accent.main }, disabled && { opacity: 0.35 }]}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled }}
              >
                <Text variant="label" color={selected ? accent.dark : colors.ink}>
                  {m}
                </Text>
              </ScalePressable>
            );
          })}
        </View>
        <Button title={`Use ${MONTH_NAMES[month]} ${year}`} onPress={confirm} disabled={isFuture(month)} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  field: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md + 2,
  },
  year: { paddingHorizontal: space.lg, paddingVertical: space.sm + 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  month: {
    width: '22.5%',
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
