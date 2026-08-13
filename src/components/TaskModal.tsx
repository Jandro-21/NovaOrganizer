import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useI18n } from '../i18n';
import { useTasksStore } from '../stores/taskStore';
import { useTheme } from '../theme';
import { BellIcon, ClockIcon, FolderIcon, LayersIcon } from './icons';
import { AppInput } from './ui/AppInput';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Dropdown, type DropdownOption } from './ui/Dropdown';

export interface TaskFormInput {
  title: string;
  notes: string;
  dueAt?: number;
  reminder: boolean;
  categoryId?: string;
  subcategoryId?: string;
}

interface TaskModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initial?: TaskFormInput;
  onClose: () => void;
  onSave: (input: TaskFormInput) => void;
}

// Normaliza la fecha inicial: hoy + 1 hora, redondeada a 5 min para que
// la rueda de selección sea cómoda al tocar "Date"/"Time" por primera vez.
function defaultDate(): Date {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return d;
}

interface FormState {
  title: string;
  notes: string;
  date: Date;
  hasDate: boolean;
  reminder: boolean;
  categoryId?: string;
  subcategoryId?: string;
}

function formFromInitial(initial?: TaskFormInput): FormState {
  return {
    title: initial?.title ?? '',
    notes: initial?.notes ?? '',
    date: initial?.dueAt ? new Date(initial.dueAt) : defaultDate(),
    hasDate: initial?.dueAt !== undefined,
    reminder: initial?.reminder ?? false,
    categoryId: initial?.categoryId,
    subcategoryId: initial?.subcategoryId,
  };
}

export function TaskModal({ visible, mode, initial, onClose, onSave }: TaskModalProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const categories = useTasksStore((s) => s.categories);
  const subcategories = useTasksStore((s) => s.subcategories);
  const [form, setForm] = useState<FormState>(() => formFromInitial(initial));
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);

  // Al abrir el modal (o cambiar de tarea) se reconstruye el formulario.
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setForm(formFromInitial(initial));
      setPicker(null);
    }
  }

  const canSave = form.title.trim().length > 0;

  const categoryOptions: DropdownOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: <View style={[styles.colorDot, { backgroundColor: c.color }]} />,
  }));

  const availableSubcategories = subcategories.filter((s) => s.categoryId === form.categoryId);
  const subcategoryOptions: DropdownOption[] = availableSubcategories.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  function selectCategory(categoryId: string) {
    const next = { ...form, categoryId: categoryId || undefined };
    // Si la subcategoría elegida no pertenece a la nueva categoría, se limpia.
    const stillValid =
      next.categoryId &&
      subcategories.some((s) => s.id === form.subcategoryId && s.categoryId === next.categoryId);
    if (!stillValid) next.subcategoryId = undefined;
    setForm(next);
  }

  function handlePickerChange(_event: unknown, selected?: Date) {
    if (selected) {
      setForm((f) => ({ ...f, date: selected, hasDate: true }));
    }
    setPicker(null);
  }

  function submit() {
    if (!canSave) return;
    onSave({
      title: form.title.trim(),
      notes: form.notes.trim(),
      dueAt: form.hasDate ? form.date.getTime() : undefined,
      reminder: form.hasDate && form.reminder,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
    });
  }

  const pickerDisplay = Platform.OS === 'ios' ? 'spinner' : 'default';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <Card style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {mode === 'edit' ? t('editTask') : t('addTask')}
          </Text>

          <AppInput
            placeholder={t('taskTitlePlaceholder')}
            value={form.title}
            onChangeText={(title) => setForm((f) => ({ ...f, title }))}
            mic
            style={styles.field}
          />
          <AppInput
            placeholder={t('taskNotesPlaceholder')}
            value={form.notes}
            onChangeText={(notes) => setForm((f) => ({ ...f, notes }))}
            mic
            style={[styles.field, styles.multiline]}
            multiline
          />

          {/* Categoría y subcategoría de la tarea. */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            {t('categoryLabel')}
          </Text>
          <Dropdown
            placeholder={t('categoryPlaceholder')}
            value={form.categoryId}
            options={categoryOptions}
            onSelect={selectCategory}
            allowClear
            clearLabel={t('noCategory')}
            icon={<FolderIcon color={theme.colors.textMuted} size={18} />}
            style={styles.field}
          />

          {form.categoryId ? (
            <>
              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                {t('subcategoryLabel')}
              </Text>
              <Dropdown
                placeholder={t('subcategoryPlaceholder')}
                value={form.subcategoryId}
                options={subcategoryOptions}
                onSelect={(subcategoryId) =>
                  setForm((f) => ({ ...f, subcategoryId: subcategoryId || undefined }))
                }
                allowClear
                clearLabel={t('noSubcategory')}
                icon={<LayersIcon color={theme.colors.textMuted} size={18} />}
                style={styles.field}
              />
            </>
          ) : null}

          {/* Selector de fecha / hora del recordatorio. */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            {t('dueDateLabel')}
          </Text>
          <View style={styles.dateRow}>
            <Button
              title={form.hasDate ? formatDate(form.date) : t('setDate')}
              variant={form.hasDate ? 'primary' : 'secondary'}
              onPress={() => setPicker('date')}
              icon={<ClockIcon color={form.hasDate ? theme.colors.onPrimary : theme.colors.text} size={16} />}
              style={styles.dateButton}
            />
            <Button
              title={form.hasDate ? formatTime(form.date) : t('setTime')}
              variant={form.hasDate ? 'primary' : 'secondary'}
              onPress={() => setPicker('time')}
              style={styles.dateButton}
            />
          </View>

          {form.hasDate ? (
            <View style={styles.reminderRow}>
              <BellIcon color={theme.colors.textMuted} size={18} />
              <Text style={[styles.reminderLabel, { color: theme.colors.text }]}>
                {t('reminderLabel')}
              </Text>
              <Switch
                value={form.reminder}
                onValueChange={(reminder) => setForm((f) => ({ ...f, reminder }))}
                trackColor={{
                  true: theme.colors.primary,
                  false: theme.colors.surfaceAlt,
                }}
                thumbColor={theme.colors.surface}
              />
            </View>
          ) : null}

          {picker ? (
            <DateTimePicker
              value={form.date}
              mode={picker}
              display={pickerDisplay}
              onChange={handlePickerChange}
            />
          ) : null}

          <View style={styles.actions}>
            <Button
              title={t('cancel')}
              variant="secondary"
              onPress={onClose}
              style={styles.actionButton}
            />
            <Button
              title={t('save')}
              onPress={submit}
              disabled={!canSave}
              style={styles.actionButton}
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatTime(d: Date): string {
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 32,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  field: {
    marginBottom: 10,
  },
  multiline: {
    minHeight: 72,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  reminderLabel: {
    flex: 1,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
  },
});
