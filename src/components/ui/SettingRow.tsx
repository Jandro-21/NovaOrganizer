import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

export function SettingRow({ label, value, onPress, icon, right }: SettingRowProps) {
  const theme = useTheme();
  const disabled = !onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.pressed,
      ]}>
      <View style={[styles.iconSlot, { backgroundColor: theme.colors.surfaceAlt }]}>
        {icon}
      </View>
      <View style={styles.textSlot}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        {value ? (
          <Text style={[styles.value, { color: theme.colors.textMuted }]}>{value}</Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  iconSlot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSlot: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text style={[styles2.section, { color: theme.colors.textMuted }]}>{children}</Text>
  );
}

const styles2 = StyleSheet.create({
  section: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
  },
});