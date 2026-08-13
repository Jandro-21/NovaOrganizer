import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { AlarmIcon, ClockIcon } from './icons';
import { AppInput } from './ui/AppInput';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { formatDate, formatTime } from './TaskModal';

export interface AlarmFormInput {
  message: string;
  date: Date;
}

interface AlarmModalProps {
  visible: boolean;
  initial?: AlarmFormInput;
  onClose: () => void;
  onSave: (input: AlarmFormInput) => void;
}

function defaultDate(): Date {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return d;
}

export function AlarmModal({ visible, initial, onClose, onSave }: AlarmModalProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const [message, setMessage] = useState(initial?.message ?? '');
  const [date, setDate] = useState<Date>(initial?.date ?? defaultDate());
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);

  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setMessage(initial?.message ?? '');
      setDate(initial?.date ?? defaultDate());
      setPicker(null);
    }
  }

  const canSave = message.trim().length > 0 && date.getTime() > Date.now();

  function handlePickerChange(_event: unknown, selected?: Date) {
    if (selected) setDate(selected);
    setPicker(null);
  }

  function submit() {
    if (!canSave) return;
    onSave({ message: message.trim(), date });
  }

  const pickerDisplay = Platform.OS === 'ios' ? 'spinner' : 'default';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <Card style={styles.card}>
          <View style={styles.titleRow}>
            <AlarmIcon color={theme.colors.primary} size={20} />
            <Text style={[styles.title, { color: theme.colors.text }]}>{t('alarmTitle')}</Text>
          </View>

          <AppInput
            placeholder={t('alarmMessagePlaceholder')}
            value={message}
            onChangeText={setMessage}
            multiline
            mic
            style={styles.field}
          />

          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            {t('alarmDateLabel')}
          </Text>
          <View style={styles.dateRow}>
            <Button
              title={formatDate(date)}
              variant="primary"
              onPress={() => setPicker('date')}
              icon={<ClockIcon color={theme.colors.onPrimary} size={16} />}
              style={styles.dateButton}
            />
            <Button
              title={formatTime(date)}
              variant="primary"
              onPress={() => setPicker('time')}
              style={styles.dateButton}
            />
          </View>

          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{t('alarmFutureHint')}</Text>

          {picker ? (
            <DateTimePicker
              value={date}
              mode={picker}
              display={pickerDisplay}
              onChange={handlePickerChange}
            />
          ) : null}

          <View style={styles.actions}>
            <Button title={t('cancel')} variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button title={t('save')} onPress={submit} disabled={!canSave} style={styles.actionButton} />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  field: {
    marginBottom: 10,
    minHeight: 72,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
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