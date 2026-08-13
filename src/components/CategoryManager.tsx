import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useI18n } from '../i18n';
import { useTasksStore } from '../stores/taskStore';
import { useTheme } from '../theme';
import { BOARD_PALETTE } from '../theme/colors';
import type { Category, Subcategory } from '../types';
import {
  CheckIcon,
  CloseIcon,
  FolderIcon,
  LayersIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
} from './icons';
import { AppInput } from './ui/AppInput';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface CategoryManagerProps {
  visible: boolean;
  onClose: () => void;
}

// Gestión de Categorías y Subcategorías: crear, renombrar, recolorear,
// añadir/eliminar subcategorías y borrar categorías enteras.
export function CategoryManager({ visible, onClose }: CategoryManagerProps) {
  const theme = useTheme();
  const { t } = useI18n();

  const categories = useTasksStore((s) => s.categories);
  const subcategories = useTasksStore((s) => s.subcategories);
  const addCategory = useTasksStore((s) => s.addCategory);
  const updateCategory = useTasksStore((s) => s.updateCategory);
  const removeCategory = useTasksStore((s) => s.removeCategory);
  const addSubcategory = useTasksStore((s) => s.addSubcategory);
  const updateSubcategory = useTasksStore((s) => s.updateSubcategory);
  const removeSubcategory = useTasksStore((s) => s.removeSubcategory);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(BOARD_PALETTE[0]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');

  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setNewName('');
      setNewColor(BOARD_PALETTE[0]);
      setExpandedId(null);
      setNewSubName('');
      setEditCatId(null);
      setEditSubId(null);
    }
  }

  function handleAddCategory() {
    if (!newName.trim()) return;
    addCategory({ name: newName, color: newColor });
    setNewName('');
  }

  function handleDeleteCategory(category: Category) {
    const count = subcategories.filter((s) => s.categoryId === category.id).length;
    Alert.alert(t('deleteCategory'), t('deleteCategoryConfirm', { count }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteCategory'),
        style: 'destructive',
        onPress: () => {
          removeCategory(category.id);
          if (expandedId === category.id) setExpandedId(null);
        },
      },
    ]);
  }

  function handleRenameCategory(category: Category) {
    const name = editCatName.trim();
    if (!name) {
      setEditCatId(null);
      return;
    }
    updateCategory(category.id, { name });
    setEditCatId(null);
  }

  function handleAddSubcategory(categoryId: string) {
    if (!newSubName.trim()) return;
    addSubcategory({ categoryId, name: newSubName });
    setNewSubName('');
  }

  function handleRenameSub(sub: Subcategory) {
    const name = editSubName.trim();
    if (!name) {
      setEditSubId(null);
      return;
    }
    updateSubcategory(sub.id, { name });
    setEditSubId(null);
  }

  function handleDeleteSub(sub: Subcategory) {
    removeSubcategory(sub.id);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <Card style={styles.card}>
          <View style={styles.header}>
            <FolderIcon color={theme.colors.primary} size={20} />
            <Text style={[styles.title, { color: theme.colors.text }]}>{t('manageCategories')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
              <CloseIcon color={theme.colors.textMuted} size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Nueva categoría. */}
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
              {t('addCategory')}
            </Text>
            <View style={styles.newRow}>
              <AppInput
                placeholder={t('categoryNamePlaceholder')}
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={handleAddCategory}
                returnKeyType="done"
                containerStyle={styles.newInput}
              />
              <Button
                title={t('addCategoryShort')}
                onPress={handleAddCategory}
                disabled={!newName.trim()}
                style={styles.addButton}
              />
            </View>
            <View style={styles.paletteRow}>
              {BOARD_PALETTE.map((c) => {
                const active = newColor === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setNewColor(c)}
                    style={[styles.swatch, { backgroundColor: c }, active && styles.swatchActive]}>
                    {active ? <CheckIcon color="#ffffff" size={16} strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Lista de categorías. */}
            {categories.length === 0 ? (
              <Text style={[styles.empty, { color: theme.colors.textMuted }]}>
                {t('noCategories')}
              </Text>
            ) : (
              categories.map((category) => {
                const subs = subcategories.filter((s) => s.categoryId === category.id);
                const expanded = expandedId === category.id;
                const editingCat = editCatId === category.id;
                return (
                  <View
                    key={category.id}
                    style={[
                      styles.category,
                      { backgroundColor: theme.colors.surfaceAlt },
                    ]}>
                    <Pressable
                      onPress={() => setExpandedId(expanded ? null : category.id)}
                      style={styles.categoryRow}>
                      <View style={[styles.colorDot, { backgroundColor: category.color }]} />
                      {editingCat ? (
                        <TextInput
                          value={editCatName}
                          onChangeText={setEditCatName}
                          onSubmitEditing={() => handleRenameCategory(category)}
                          onBlur={() => handleRenameCategory(category)}
                          autoFocus
                          placeholder={t('categoryNamePlaceholder')}
                          placeholderTextColor={theme.colors.textMuted}
                          style={[
                            styles.renameInput,
                            { color: theme.colors.text, backgroundColor: theme.colors.surface },
                          ]}
                        />
                      ) : (
                        <Text
                          numberOfLines={1}
                          style={[styles.categoryName, { color: theme.colors.text }]}>
                          {category.name}
                        </Text>
                      )}
                      <Text style={[styles.subCount, { color: theme.colors.textMuted }]}>
                        {subs.length} {t('subcategoryCount')}
                      </Text>
                      <Pressable
                        onPress={() => {
                          setEditCatId(category.id);
                          setEditCatName(category.name);
                        }}
                        hitSlop={8}
                        style={styles.rowIcon}
                        accessibilityRole="button">
                        <PencilIcon color={theme.colors.textMuted} size={16} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteCategory(category)}
                        hitSlop={8}
                        style={styles.rowIcon}
                        accessibilityRole="button">
                        <TrashIcon color={theme.colors.danger} size={16} />
                      </Pressable>
                    </Pressable>

                    {expanded ? (
                      <View style={styles.expanded}>
                        {subs.length === 0 ? (
                          <Text style={[styles.noSubs, { color: theme.colors.textMuted }]}>
                            {t('noSubcategories')}
                          </Text>
                        ) : (
                          subs.map((sub) => {
                            const editingSub = editSubId === sub.id;
                            return (
                              <View key={sub.id} style={styles.subRow}>
                                <LayersIcon color={theme.colors.textMuted} size={14} />
                                {editingSub ? (
                                  <TextInput
                                    value={editSubName}
                                    onChangeText={setEditSubName}
                                    onSubmitEditing={() => handleRenameSub(sub)}
                                    onBlur={() => handleRenameSub(sub)}
                                    autoFocus
                                    placeholder={t('subcategoryNamePlaceholder')}
                                    placeholderTextColor={theme.colors.textMuted}
                                    style={[
                                      styles.renameInput,
                                      {
                                        color: theme.colors.text,
                                        backgroundColor: theme.colors.surface,
                                      },
                                    ]}
                                  />
                                ) : (
                                  <Text
                                    numberOfLines={1}
                                    style={[styles.subName, { color: theme.colors.text }]}>
                                    {sub.name}
                                  </Text>
                                )}
                                <Pressable
                                  onPress={() => {
                                    setEditSubId(sub.id);
                                    setEditSubName(sub.name);
                                  }}
                                  hitSlop={8}
                                  style={styles.rowIcon}
                                  accessibilityRole="button">
                                  <PencilIcon color={theme.colors.textMuted} size={14} />
                                </Pressable>
                                <Pressable
                                  onPress={() => handleDeleteSub(sub)}
                                  hitSlop={8}
                                  style={styles.rowIcon}
                                  accessibilityRole="button">
                                  <TrashIcon color={theme.colors.danger} size={14} />
                                </Pressable>
                              </View>
                            );
                          })
                        )}

                        <View style={styles.newSubRow}>
                          <AppInput
                            placeholder={t('subcategoryNamePlaceholder')}
                            value={newSubName}
                            onChangeText={setNewSubName}
                            onSubmitEditing={() => handleAddSubcategory(category.id)}
                            returnKeyType="done"
                            containerStyle={styles.newInput}
                          />
                          <Pressable
                            onPress={() => handleAddSubcategory(category.id)}
                            disabled={!newSubName.trim()}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                              styles.addSubButton,
                              {
                                backgroundColor: theme.colors.primary,
                                opacity: !newSubName.trim() ? 0.4 : pressed ? 0.85 : 1,
                              },
                            ]}>
                            <PlusCircleIcon color={theme.colors.onPrimary} size={20} />
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    maxHeight: 520,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  newRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  newInput: {
    flex: 1,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: '#00000055',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 28,
    fontSize: 15,
  },
  category: {
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  renameInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  subCount: {
    fontSize: 12,
  },
  rowIcon: {
    padding: 4,
  },
  expanded: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#00000015',
    gap: 6,
  },
  noSubs: {
    fontSize: 13,
    paddingVertical: 4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  subName: {
    flex: 1,
    fontSize: 14,
  },
  newSubRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  addSubButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
