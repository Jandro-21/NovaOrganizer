import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CategoryManager } from '../components/CategoryManager';
import { AddIcon, CheckIcon, EditIcon, FolderIcon, TrashIcon } from '../components/icons';
import { NovaLogo } from '../components/NovaLogo';
import { TaskModal, formatDate, formatTime, type TaskFormInput } from '../components/TaskModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { useI18n } from '../i18n';
import {
  cancelReminder,
  ensureNotificationPermission,
  hasNotificationPermission,
  scheduleReminder,
} from '../services/notificationService';
import { useTasksStore } from '../stores/taskStore';
import { useTheme } from '../theme';
import type { Task } from '../types';

interface ModalState {
  mode: 'create' | 'edit';
  task?: Task;
}

export function TodoScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const tasks = useTasksStore((s) => s.tasks);
  const categories = useTasksStore((s) => s.categories);
  const subcategories = useTasksStore((s) => s.subcategories);
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const clearCompleted = useTasksStore((s) => s.clearCompleted);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );
  const subcategoryNames = useMemo(
    () => Object.fromEntries(subcategories.map((s) => [s.id, s])),
    [subcategories],
  );

  const filteredTasks = useMemo(
    () => (activeCategory ? tasks.filter((x) => x.categoryId === activeCategory) : tasks),
    [tasks, activeCategory],
  );

  // Programa (o reprograma) el recordatorio de una tarea y devuelve su id.
  async function scheduleFor(input: TaskFormInput): Promise<string | undefined> {
    if (!input.reminder || !input.dueAt) return undefined;
    const granted = await hasNotificationPermission();
    if (!granted && !(await ensureNotificationPermission())) {
      Alert.alert(t('reminderLabel'), t('permissionNeeded'));
      return undefined;
    }
    return scheduleReminder({
      title: input.title,
      body: input.notes || undefined,
      date: new Date(input.dueAt),
    });
  }

  async function handleSave(input: TaskFormInput) {
    if (!modal) return;
    if (modal.mode === 'edit' && modal.task) {
      // Al editar se cancela el recordatorio anterior y se programa uno nuevo.
      await cancelReminder(modal.task.notificationId);
      const notificationId = await scheduleFor(input);
      updateTask(modal.task.id, {
        title: input.title,
        notes: input.notes,
        dueAt: input.dueAt,
        notificationId,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
      });
    } else {
      const notificationId = await scheduleFor(input);
      addTask({
        title: input.title,
        notes: input.notes,
        dueAt: input.dueAt,
        notificationId,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
      });
    }
    setModal(null);
  }

  // Al completar una tarea se cancela su recordatorio; al reactivarla
  // se vuelve a programar si aún tiene fecha futura.
  async function handleToggle(task: Task) {
    const completing = !task.completed;
    if (completing && task.notificationId) {
      await cancelReminder(task.notificationId);
    }
    if (!completing && task.dueAt && task.dueAt > Date.now()) {
      const notificationId = await scheduleFor({
        title: task.title,
        notes: task.notes,
        dueAt: task.dueAt,
        reminder: true,
      });
      updateTask(task.id, { notificationId });
    }
    toggleTask(task.id);
  }

  function confirmDelete(task: Task) {
    Alert.alert(t('deleteTask'), t('deleteTaskConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteTask'),
        style: 'destructive',
        onPress: async () => {
          await cancelReminder(task.notificationId);
          removeTask(task.id);
        },
      },
    ]);
  }

  async function handleClearCompleted() {
    for (const task of tasks) {
      if (task.completed && task.notificationId) {
        await cancelReminder(task.notificationId);
      }
    }
    clearCompleted();
  }

  function renderTask({ item }: { item: Task }) {
    const overdue = item.dueAt && item.dueAt < Date.now() && !item.completed;
    const category = item.categoryId ? categoryNames[item.categoryId] : undefined;
    const subcategory = item.subcategoryId ? subcategoryNames[item.subcategoryId] : undefined;
    return (
      <Card style={styles.taskCard}>
        <Pressable
          onPress={() => handleToggle(item)}
          style={[
            styles.checkbox,
            {
              borderColor: item.completed ? theme.colors.success : theme.colors.border,
              backgroundColor: item.completed ? theme.colors.success : 'transparent',
            },
          ]}>
          {item.completed ? <CheckIcon color={theme.colors.onPrimary} size={14} strokeWidth={3} /> : null}
        </Pressable>

        <Pressable style={styles.taskBody} onPress={() => setModal({ mode: 'edit', task: item })}>
          <Text
            numberOfLines={2}
            style={[
              styles.taskTitle,
              {
                color: item.completed ? theme.colors.textMuted : theme.colors.text,
                textDecorationLine: item.completed ? 'line-through' : 'none',
              },
            ]}>
            {item.title}
          </Text>
          {category || subcategory ? (
            <View style={styles.badgeRow}>
              {category ? (
                <View style={styles.badge}>
                  <View style={[styles.badgeDot, { backgroundColor: category.color }]} />
                  <Text style={[styles.badgeText, { color: theme.colors.textMuted }]}>
                    {category.name}
                  </Text>
                </View>
              ) : null}
              {subcategory ? (
                <Text style={[styles.badgeText, { color: theme.colors.textMuted }]}>
                  {subcategory.name}
                </Text>
              ) : null}
            </View>
          ) : null}
          {item.dueAt ? (
            <Text
              style={[
                styles.dueText,
                { color: overdue ? theme.colors.danger : theme.colors.textMuted },
              ]}>
              {t('dueDate')} {formatDate(new Date(item.dueAt))} · {formatTime(new Date(item.dueAt))}
              {item.notificationId ? ' · ' + t('reminderLabel') : ''}
            </Text>
          ) : null}
          {item.notes ? (
            <Text numberOfLines={1} style={[styles.notesText, { color: theme.colors.textMuted }]}>
              {item.notes}
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          onPress={() => setModal({ mode: 'edit', task: item })}
          style={styles.iconButton}>
          <EditIcon color={theme.colors.textMuted} size={18} />
        </Pressable>
        <Pressable onPress={() => confirmDelete(item)} style={styles.iconButton}>
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
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('todoTitle')}</Text>
          <Text style={[styles.count, { color: theme.colors.textMuted }]}>
            {filteredTasks.filter((x) => !x.completed).length} / {filteredTasks.length}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowCategories(true)}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel={t('manageCategories')}>
          <FolderIcon color={theme.colors.textMuted} size={20} />
        </Pressable>
        {tasks.some((x) => x.completed) ? (
          <Button
            title={t('clearCompleted')}
            variant="ghost"
            onPress={handleClearCompleted}
            style={styles.clearButton}
          />
        ) : null}
      </View>

      {/* Filtro visual por categorías. */}
      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}>
          <Pressable
            onPress={() => setActiveCategory(null)}
            style={[
              styles.chip,
              { backgroundColor: activeCategory === null ? theme.colors.primary : theme.colors.surfaceAlt },
            ]}>
            <Text
              style={[
                styles.chipText,
                { color: activeCategory === null ? theme.colors.onPrimary : theme.colors.text },
              ]}>
              {t('allCategories')}
            </Text>
          </Pressable>
          {categories.map((c) => {
            const active = activeCategory === c.id;
            const count = tasks.filter((x) => x.categoryId === c.id && !x.completed).length;
            return (
              <Pressable
                key={c.id}
                onPress={() => setActiveCategory(active ? null : c.id)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt },
                ]}>
                <View style={[styles.chipDot, { backgroundColor: c.color }]} />
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? theme.colors.onPrimary : theme.colors.text },
                  ]}>
                  {c.name} · {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              {activeCategory ? t('emptyCategory') : t('emptyTasks')}
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => setModal({ mode: 'create' })}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}>
        <AddIcon color={theme.colors.onPrimary} size={22} />
      </Pressable>

      <TaskModal
        visible={modal !== null}
        mode={modal?.mode ?? 'create'}
        initial={
          modal?.task
            ? {
                title: modal.task.title,
                notes: modal.task.notes,
                dueAt: modal.task.dueAt,
                reminder: modal.task.notificationId !== undefined,
                categoryId: modal.task.categoryId,
                subcategoryId: modal.task.subcategoryId,
              }
            : undefined
        }
        onClose={() => setModal(null)}
        onSave={handleSave}
      />

      <CategoryManager visible={showCategories} onClose={() => setShowCategories(false)} />
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
  count: {
    fontSize: 13,
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipContent: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    padding: 20,
    paddingBottom: 120,
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dueText: {
    fontSize: 12,
    marginTop: 4,
  },
  notesText: {
    fontSize: 13,
    marginTop: 2,
  },
  headerIconButton: {
    padding: 8,
  },
  iconButton: {
    padding: 6,
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
