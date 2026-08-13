import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { CheckIcon, ChevronDownIcon } from '../icons';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  placeholder: string;
  value?: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  allowClear?: boolean;
  clearLabel?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

// Selector desplegable reutilizable con estética acorde al AppInput:
// muestra el valor seleccionado y abre una hoja inferior con las opciones.
export function Dropdown({
  placeholder,
  value,
  options,
  onSelect,
  allowClear = false,
  clearLabel = 'None',
  icon,
  style,
}: DropdownProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.colors.surfaceAlt },
          pressed && styles.pressed,
          style,
        ]}>
        {icon}
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            { color: selected ? theme.colors.text : theme.colors.textMuted },
          ]}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDownIcon color={theme.colors.textMuted} size={18} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdropTouchable} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{placeholder}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  {item.icon}
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: active ? theme.colors.primary : theme.colors.text },
                    ]}>
                    {item.label}
                  </Text>
                  {active ? <CheckIcon color={theme.colors.primary} size={18} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{placeholder}</Text>
            }
          />
          {allowClear ? (
            <Pressable
              onPress={() => {
                onSelect('');
                setOpen(false);
              }}
              style={({ pressed }) => [styles.clearRow, pressed && styles.pressed]}>
              <Text style={[styles.clearLabel, { color: theme.colors.textMuted }]}>{clearLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
  },
  value: {
    flex: 1,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
  backdropTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  clearRow: {
    borderTopWidth: 1,
    borderTopColor: '#00000015',
    paddingTop: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  clearLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
