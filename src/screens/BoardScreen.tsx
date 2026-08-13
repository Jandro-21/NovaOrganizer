import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
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
import { AddIcon, CheckSquareIcon, MergeIcon, QuestionIcon, SummarizeIcon, TrashIcon } from '../components/icons';
import { NovaLogo } from '../components/NovaLogo';
import { AppInput } from '../components/ui/AppInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { useI18n } from '../i18n';
import { askAi } from '../services/aiService';
import { useBoardStore } from '../stores/boardStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../theme';
import { BOARD_PALETTE } from '../theme/colors';
import {
  BOARD_NOTE_SIZES,
  NOTE_SIZE_ORDER,
  type BoardNote,
  type NoteSize,
} from '../types';

const COLUMN_GAP = 12;
const PAGE_PADDING = 20;

// Convierte un id a un ángulo de rotación pequeño y estable para dar
// a las notas un aspecto de "post-it" más orgánico.
function rotationForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  }
  return ((hash % 7) - 3) * 0.8;
}

// Altura de la nota según tamaño, escalada al ancho real de la columna.
function heightForSize(size: NoteSize, columnWidth: number): number {
  const ratio = size === 'small' ? 0.82 : size === 'medium' ? 1 : 1.25;
  return columnWidth * ratio;
}

// Reparte las notas en N columnas (Masonry) de forma equilibrada:
// cada nota se añade a la columna más corta del momento.
function splitColumns(notes: BoardNote[], columnCount: number, columnWidth: number): BoardNote[][] {
  const columns: BoardNote[][] = Array.from({ length: columnCount }, () => []);
  const heights = Array.from({ length: columnCount }, () => 0);
  for (const note of notes) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(note);
    heights[shortest] += heightForSize(note.size, columnWidth) + COLUMN_GAP;
  }
  return columns;
}

interface NoteModalState {
  mode: 'create' | 'edit';
  noteId?: string;
  text: string;
  color: string;
  size: NoteSize;
}

type AiAction = 'merge' | 'summarize' | 'explain';

// Nota individual del corcho. Tap abre el editor; long-press activa la
// selección múltiple para las acciones de IA del "corcho inteligente".
function StickyNote({
  note,
  selected,
  onPress,
  onLongPress,
}: {
  note: BoardNote;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const size = BOARD_NOTE_SIZES[note.size];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={({ pressed }) => [
        styles.note,
        {
          backgroundColor: note.color,
          minHeight: Math.round(size.height * 0.9),
          opacity: pressed ? 0.85 : 1,
        },
        selected && { borderColor: theme.colors.primary, borderWidth: 3 },
        { transform: [{ rotate: `${rotationForId(note.id)}deg` }] },
      ]}>
      {selected ? (
        <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
          <CheckSquareIcon color={theme.colors.onPrimary} size={14} strokeWidth={3} />
        </View>
      ) : null}
      <Text
        numberOfLines={10}
        style={[styles.noteText, { fontSize: size.fontSize, color: '#2B2B2B' }]}>
        {note.text}
      </Text>
    </Pressable>
  );
}

export function BoardScreen() {
  const theme = useTheme();
  const { t } = useI18n();

  const notes = useBoardStore((s) => s.notes);
  const addNote = useBoardStore((s) => s.addNote);
  const updateNote = useBoardStore((s) => s.updateNote);
  const removeNote = useBoardStore((s) => s.removeNote);

  const provider = useSettingsStore((s) => s.provider);
  const apiKey = useSettingsStore((s) => s.apiKey);

  // Responsive: el ancho real del dispositivo define las columnas del corcho.
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const columnCount = windowWidth >= 720 ? 3 : 2;
  const columnWidth = (windowWidth - PAGE_PADDING * 2 - COLUMN_GAP * (columnCount - 1)) / columnCount;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aiMenuVisible, setAiMenuVisible] = useState(false);
  const [modal, setModal] = useState<NoteModalState | null>(null);
  const [text, setText] = useState('');
  const [color, setColor] = useState(BOARD_PALETTE[0]);
  const [size, setSize] = useState<NoteSize>('medium');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; content: string } | null>(null);
  const [question, setQuestion] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);

  const columns = useMemo(
    () => splitColumns(notes, columnCount, columnWidth),
    [notes, columnCount, columnWidth],
  );

  const selectedNotes = useMemo(
    () => notes.filter((n) => selected.has(n.id)),
    [notes, selected],
  );

  function openCreate() {
    setText('');
    setColor(BOARD_PALETTE[notes.length % BOARD_PALETTE.length]);
    setSize('medium');
    setModal({ mode: 'create', text: '', color: '', size: 'medium' });
  }

  function openEdit(note: BoardNote) {
    setText(note.text);
    setColor(note.color);
    setSize(note.size);
    setModal({ mode: 'edit', noteId: note.id, text: note.text, color: note.color, size: note.size });
  }

  function handleNotePress(note: BoardNote) {
    if (selected.size > 0) {
      toggleSelection(note.id);
      return;
    }
    openEdit(note);
  }

  function toggleSelection(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    if (!modal) return;
    const content = text.trim() || t('boardNewNote');
    if (modal.mode === 'create') {
      addNote({ x: 0, y: 0, text: content, color, size });
    } else if (modal.noteId) {
      updateNote(modal.noteId, { text: content, color, size });
    }
    setModal(null);
  }

  function handleDeleteNote() {
    if (!modal?.noteId) return;
    removeNote(modal.noteId);
    setModal(null);
  }

  function clearSelection() {
    setSelected(new Set());
    setAiMenuVisible(false);
  }

  function deleteSelected() {
    const count = selected.size;
    Alert.alert(t('deleteNote'), t('deleteSelectedConfirm', { count }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteNote'),
        style: 'destructive',
        onPress: () => {
          selected.forEach((id) => removeNote(id));
          clearSelection();
        },
      },
    ]);
  }

  const promptForAction = useCallback(
    (action: AiAction, labels: string[]): string => {
      const body = labels
        .map((label, i) => `${i + 1}. ${label}`)
        .join('\n');
      if (action === 'merge') {
        return `Merge the following notes into ONE single, coherent text. Preserve every key idea and remove redundancy:\n\n${body}`;
      }
      if (action === 'summarize') {
        return `Provide a concise summary of the following notes. Keep the most important ideas:\n\n${body}`;
      }
      return `Explain the following notes in depth, expanding each idea in clear language:\n\n${body}`;
    },
    [],
  );

  async function runAi(action: AiAction, customQuestion?: string) {
    const notesToSend = selectedNotes;
    if (notesToSend.length === 0) return;
    setAiBusy(true);
    setAiMenuVisible(false);
    setShowQuestion(false);
    let instruction: string;
    const customText = customQuestion?.trim();
    const isCustom = action === 'explain' && !!customText;
    if (isCustom) {
      instruction = customText + '\n\nNotes to use as context:\n'
        + notesToSend.map((n, i) => `${i + 1}. ${n.text}`).join('\n');
    } else {
      instruction = promptForAction(
        action,
        notesToSend.map((n) => n.text),
      );
    }

    const res = await askAi({
      provider,
      apiKey,
      turns: [{ role: 'user', content: instruction }],
    });
    setAiBusy(false);

    if (res.error) {
      Alert.alert(t('aiBoardTitle'), res.error);
      return;
    }

    if (action === 'merge') {
      // Fusionar: crea una nota nueva con el resultado y elimina las originales.
      addNote({ x: 0, y: 0, text: res.content, color: BOARD_PALETTE[notes.length % BOARD_PALETTE.length], size: 'large' });
      notesToSend.forEach((n) => removeNote(n.id));
      clearSelection();
    } else if (action === 'summarize') {
      // Resumir: guarda el resumen como una nota nueva.
      addNote({ x: 0, y: 0, text: res.content, color: BOARD_PALETTE[(notes.length + 1) % BOARD_PALETTE.length], size: 'medium' });
      clearSelection();
    } else {
      setAiResult({ title: t('aiExplainTitle'), content: res.content });
    }
  }

  const canRunAi = selectedNotes.length > 0 && !aiBusy;

  return (
    <Screen>
      <View style={styles.header}>
        <NovaLogo size={34} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('boardTitle')}</Text>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{t('boardHint')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.boardScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <Pressable onPress={openCreate} style={styles.emptyBoard}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('emptyBoard')}</Text>
          </Pressable>
        ) : (
          <View style={styles.columns}>
            {columns.map((column, idx) => (
              <View key={idx} style={styles.column}>
                {column.map((note) => (
                  <StickyNote
                    key={note.id}
                    note={note}
                    selected={selected.has(note.id)}
                    onPress={() => handleNotePress(note)}
                    onLongPress={() => {
                      toggleSelection(note.id);
                      setAiMenuVisible(true);
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botón flotante para añadir una idea nueva de forma rápida. */}
      <Pressable
        onPress={openCreate}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}>
        <AddIcon color={theme.colors.onPrimary} size={22} />
      </Pressable>

      {/* Barra flotante de selección cuando hay notas marcadas. */}
      {selectedNotes.length > 0 ? (
        <View style={[styles.selectionBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.selectionCount, { color: theme.colors.text }]}>
            {selectedNotes.length} {t('boardSelected')}
          </Text>
          <Pressable
            onPress={() => setAiMenuVisible(true)}
            disabled={!canRunAi}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.selectionAction,
              { backgroundColor: theme.colors.primary, opacity: !canRunAi ? 0.5 : pressed ? 0.85 : 1 },
            ]}>
            <Text style={[styles.selectionActionLabel, { color: theme.colors.onPrimary }]}>
              {t('aiBoardTitle')}
            </Text>
          </Pressable>
          <Pressable onPress={deleteSelected} accessibilityRole="button" style={styles.selectionDelete}>
            <TrashIcon color={theme.colors.danger} size={20} />
          </Pressable>
          <Pressable onPress={clearSelection} accessibilityRole="button" style={styles.selectionDelete}>
            <Text style={[styles.selectionDone, { color: theme.colors.textMuted }]}>{t('done')}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Modal de creación / edición de notas. */}
      <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTouchable} onPress={() => setModal(null)} />
          <Card style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {modal?.mode === 'edit' ? t('editNote') : t('addIdea')}
            </Text>

            <AppInput
              placeholder={t('newIdeaPlaceholder')}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={280}
              mic
              style={styles.noteInput}
            />

            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>{t('boardSizeLabel')}</Text>
            <View style={styles.sizeRow}>
              {NOTE_SIZE_ORDER.map((s) => {
                const active = size === s;
                return (
                  <Button
                    key={s}
                    title={t(`boardSize${s[0].toUpperCase()}${s.slice(1)}`)}
                    variant={active ? 'primary' : 'ghost'}
                    onPress={() => setSize(s)}
                    style={styles.sizeButton}
                  />
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>{t('boardColorLabel')}</Text>
            <View style={styles.paletteRow}>
              {BOARD_PALETTE.map((c) => {
                const active = color === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[styles.swatch, { backgroundColor: c }, active && styles.swatchActive]}
                  />
                );
              })}
            </View>

            <View style={styles.modalActions}>
              {modal?.mode === 'edit' ? (
                <Button
                  title={t('deleteNote')}
                  variant="danger"
                  onPress={handleDeleteNote}
                  icon={<TrashIcon color={theme.colors.onPrimary} size={18} />}
                  style={styles.actionButton}
                />
              ) : null}
              <Button title={t('cancel')} variant="secondary" onPress={() => setModal(null)} style={styles.actionButton} />
              <Button title={t('save')} onPress={handleSave} style={styles.actionButton} />
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>

      {/* Menú contextual de acciones IA del corcho inteligente. */}
      <Modal visible={aiMenuVisible} transparent animationType="slide" onRequestClose={() => setAiMenuVisible(false)}>
        <Pressable style={styles.backdropTouchable} onPress={() => setAiMenuVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
            {selectedNotes.length} {t('boardSelected')} — {t('aiBoardTitle')}
          </Text>
          {([
            { id: 'merge' as AiAction, icon: <MergeIcon color={theme.colors.text} size={20} />, label: t('aiMerge') },
            { id: 'summarize' as AiAction, icon: <SummarizeIcon color={theme.colors.text} size={20} />, label: t('aiSummarize') },
            { id: 'explain' as AiAction, icon: <QuestionIcon color={theme.colors.text} size={20} />, label: t('aiExplain') },
          ]).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => runAi(item.id)}
              disabled={aiBusy}
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}>
              {item.icon}
              <Text style={[styles.sheetRowLabel, { color: theme.colors.text }]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setQuestion('');
              setShowQuestion(true);
            }}
            disabled={aiBusy}
            style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}>
            <QuestionIcon color={theme.colors.text} size={20} />
            <Text style={[styles.sheetRowLabel, { color: theme.colors.text }]}>{t('aiCustomQuestion')}</Text>
          </Pressable>
          <Button title={t('cancel')} variant="secondary" onPress={() => setAiMenuVisible(false)} style={styles.sheetCancel} />
        </View>
      </Modal>

      {/* Modal de pregunta libre a la IA sobre las notas seleccionadas. */}
      <Modal visible={showQuestion} transparent animationType="slide" onRequestClose={() => setShowQuestion(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTouchable} onPress={() => setShowQuestion(false)} />
          <Card style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('aiCustomTitle')}</Text>
            <AppInput
              placeholder={t('aiCustomPlaceholder')}
              value={question}
              onChangeText={setQuestion}
              multiline
              mic
              style={styles.noteInput}
            />
            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => setShowQuestion(false)} style={styles.actionButton} />
              <Button
                title={t('send')}
                loading={aiBusy}
                disabled={!question.trim()}
                onPress={() => runAi('explain', question)}
                style={styles.actionButton}
              />
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>

      {/* Resultado de las acciones de IA (explicación / pregunta libre). */}
      <Modal visible={aiResult !== null} transparent animationType="fade" onRequestClose={() => setAiResult(null)}>
        <View style={styles.resultBackdrop}>
          <Card style={styles.resultCard}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{aiResult?.title}</Text>
            <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.resultText, { color: theme.colors.text }]}>{aiResult?.content}</Text>
            </ScrollView>
            <Button title={t('done')} onPress={() => setAiResult(null)} style={styles.resultButton} />
          </Card>
        </View>
      </Modal>
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
  scroll: {
    flex: 1,
  },
  boardScroll: {
    paddingHorizontal: PAGE_PADDING,
    paddingBottom: 140,
  },
  columns: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: COLUMN_GAP,
  },
  note: {
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    fontWeight: '500',
    lineHeight: 20,
  },
  emptyBoard: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  selectionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  selectionCount: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  selectionAction: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  selectionActionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionDelete: {
    padding: 6,
  },
  selectionDone: {
    fontSize: 14,
    fontWeight: '600',
    padding: 6,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 32,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  noteInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 10,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: '#00000033',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  sheetRowPressed: {
    opacity: 0.6,
  },
  sheetRowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sheetCancel: {
    marginTop: 8,
  },
  resultBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    width: '100%',
    maxHeight: '70%',
  },
  resultScroll: {
    maxHeight: 360,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
  },
  resultButton: {
    paddingVertical: 12,
  },
});