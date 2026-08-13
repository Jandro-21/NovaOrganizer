import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlarmModal, type AlarmFormInput } from '../components/AlarmModal';
import { AddIcon, AlarmIcon, TrashIcon } from '../components/icons';
import { NovaLogo } from '../components/NovaLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { formatDate, formatTime } from '../components/TaskModal';
import { useI18n } from '../i18n';
import {
  cancelReminder,
  ensureNotificationPermission,
  hasNotificationPermission,
  scheduleAlarm,
} from '../services/notificationService';
import { useAlarmsStore } from '../stores/alarmStore';
import { useTheme } from '../theme';
import type { Alarm } from '../types';

export function AlarmScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const alarms = useAlarmsStore((s) => s.alarms);
  const addAlarm = useAlarmsStore((s) => s.addAlarm);
  const updateAlarm = useAlarmsStore((s) => s.updateAlarm);
  const removeAlarm = useAlarmsStore((s) => s.removeAlarm);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);

  async function handleSave(input: AlarmFormInput) {
    const granted = await hasNotificationPermission();
    if (!granted && !(await ensureNotificationPermission())) {
      Alert.alert(t('alarmTitle'), t('permissionNeeded'));
      return;
    }

    if (editing) {
      await cancelReminder(editing.notificationId);
      const notificationId = await scheduleAlarm({ message: input.message, date: input.date });
      updateAlarm(editing.id, { message: input.message, date: input.date.getTime(), notificationId });
    } else {
      const notificationId = await scheduleAlarm({ message: input.message, date: input.date });
      addAlarm({ message: input.message, date: input.date.getTime(), notificationId });
    }
    setModalVisible(false);
    setEditing(null);
  }

  function openEdit(alarm: Alarm) {
    setEditing(alarm);
    setModalVisible(true);
  }

  function confirmDelete(alarm: Alarm) {
    Alert.alert(t('deleteAlarm'), t('deleteAlarmConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteAlarm'),
        style: 'destructive',
        onPress: async () => {
          await cancelReminder(alarm.notificationId);
          removeAlarm(alarm.id);
        },
      },
    ]);
  }

  function renderAlarm({ item }: { item: Alarm }) {
    const expired = item.date < Date.now();
    return (
      <Card style={styles.alarmCard}>
        <Pressable onPress={() => openEdit(item)} style={styles.alarmBody}>
          <View style={[styles.alarmIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
            <AlarmIcon color={expired ? theme.colors.textMuted : theme.colors.primary} size={20} />
          </View>
          <View style={styles.alarmText}>
            <Text
              numberOfLines={2}
              style={[
                styles.alarmMessage,
                { color: expired ? theme.colors.textMuted : theme.colors.text },
              ]}>
              {item.message}
            </Text>
            <Text style={[styles.alarmWhen, { color: expired ? theme.colors.textMuted : theme.colors.primary }]}>
              {formatDate(new Date(item.date))} · {formatTime(new Date(item.date))}
              {expired ? ` · ${t('alarmExpired')}` : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={() => confirmDelete(item)} style={styles.deleteButton}>
          <TrashIcon color={theme.colors.danger} size={18} />
        </Pressable>
      </Card>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <NovaLogo size={34} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('alarmsTitle')}</Text>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{t('alarmsHint')}</Text>
        </View>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={renderAlarm}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('emptyAlarms')}</Text>
          </View>
        }
      />

      <Pressable
        onPress={() => {
          setEditing(null);
          setModalVisible(true);
        }}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}>
        <AddIcon color={theme.colors.onPrimary} size={22} />
      </Pressable>

      <AlarmModal
        visible={modalVisible}
        initial={editing ? { message: editing.message, date: new Date(editing.date) } : undefined}
        onClose={() => {
          setModalVisible(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    marginTop: 4,
  },
  list: {
    padding: 20,
    paddingBottom: 120,
    gap: 10,
  },
  alarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alarmIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmText: {
    flex: 1,
  },
  alarmMessage: {
    fontSize: 15,
    fontWeight: '600',
  },
  alarmWhen: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});