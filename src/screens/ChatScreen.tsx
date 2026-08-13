import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddIcon, HistoryIcon, SendIcon, TrashIcon } from '../components/icons';
import { NovaLogo } from '../components/NovaLogo';
import { AppInput } from '../components/ui/AppInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { useI18n } from '../i18n';
import { askAi, getProviderLabel } from '../services/aiService';
import { buildSystemPrompt } from '../services/contextDump';
import { executeToolCall, extractToolCall } from '../services/toolService';
import { selectActiveMessages, useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../theme';
import type { ChatMessage, ChatSession } from '../types';

type ChatItem = ChatMessage | { kind: 'pending' } | { kind: 'error'; content: string };

export function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const isPending = useChatStore((s) => s.isPending);
  const error = useChatStore((s) => s.error);
  const startNewSession = useChatStore((s) => s.startNewSession);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addAssistantMessage = useChatStore((s) => s.addAssistantMessage);
  const setPending = useChatStore((s) => s.setPending);
  const setError = useChatStore((s) => s.setError);
  const clearActiveSession = useChatStore((s) => s.clearActiveSession);

  const messages = useChatStore(selectActiveMessages);
  const activeTitle = useMemo(
    () => sessions.find((s) => s.id === activeSessionId)?.title ?? t('chatTitle'),
    [sessions, activeSessionId, t],
  );

  const provider = useSettingsStore((s) => s.provider);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);

  // La FlatList es invertida: los elementos se renderizan de abajo hacia arriba,
  // por lo que los nuevos mensajes y el indicador de "pensando" aparecen al fondo.
  const data = useMemo<ChatItem[]>(() => {
    const items: ChatItem[] = [];
    for (const m of messages) items.push(m);
    if (error) items.push({ kind: 'error', content: error });
    if (isPending) items.push({ kind: 'pending' });
    return items.reverse();
  }, [messages, error, isPending]);

  const startSession = useCallback(() => {
    startNewSession();
    setInput('');
  }, [startNewSession]);

  // Envía el mensaje con la sesión activa, el contexto global de la app
  // (tareas/notas/alarmas) y el historial reciente de la conversación.
  async function handleSend() {
    const content = input.trim();
    if (!content || isPending) return;
    if (!apiKey) {
      Alert.alert(t('chatTitle'), t('apiKeyNeededForChat'));
      return;
    }
    setInput('');
    setError(null);
    addUserMessage(content);

    const history = selectActiveMessages(useChatStore.getState());
    const context = history.slice(-20).map((m) => ({ role: m.role, content: m.content }));
    setPending(true);
    const res = await askAi({
      provider,
      apiKey,
      turns: context,
      systemPrompt: buildSystemPrompt(),
    });
    setPending(false);

    if (res.error) {
      setError(res.error);
    } else {
      // Tool calling / context actions: si la IA pidió crear elementos
      // (tarea, nota o alarma) se ejecutan contra los stores globales.
      let content = res.content;
      const extracted = extractToolCall(res.content);
      if (extracted) {
        content = extracted.rest;
        const result = executeToolCall(extracted.call);
        const note = result.ok ? result.message : `Error: ${result.message}`;
        content = content ? `${content}\n\n${note}` : note;
      }
      addAssistantMessage(content || t('chatError', { message: 'Empty response' }));
    }
  }

  function confirmClear() {
    Alert.alert(t('clearChat'), t('clearChatConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('clearChat'), style: 'destructive', onPress: clearActiveSession },
    ]);
  }

  function confirmDeleteSession(session: ChatSession) {
    Alert.alert(t('deleteConversation'), t('deleteConversationConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteConversation'),
        style: 'destructive',
        onPress: () => deleteSession(session.id),
      },
    ]);
  }

  function renderItem({ item }: { item: ChatItem }) {
    if ('kind' in item) {
      if (item.kind === 'pending') {
        return (
          <View style={[styles.bubbleRow, styles.assistantRow]}>
            <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={[styles.bubbleText, { color: theme.colors.textMuted }]}>{t('thinking')}</Text>
            </View>
          </View>
        );
      }
      return (
        <View style={[styles.bubbleRow, styles.assistantRow]}>
          <View style={[styles.bubble, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.danger }]}>
            <Text style={[styles.bubbleText, { color: theme.colors.danger }]}>{item.content}</Text>
          </View>
        </View>
      );
    }
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
          ]}>
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? theme.colors.onPrimary : theme.colors.text },
            ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <NovaLogo size={30} style={styles.logo} />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            {activeTitle}
          </Text>
          <Text style={[styles.provider, { color: theme.colors.textMuted }]}>
            {t('chatUsing', { provider: getProviderLabel(provider) })}
          </Text>
        </View>
        <Pressable onPress={() => setShowSessions(true)} style={styles.iconButton} accessibilityRole="button">
          <HistoryIcon color={theme.colors.textMuted} size={20} />
        </Pressable>
        <Pressable
          onPress={startSession}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t('newConversation')}>
          <AddIcon color={theme.colors.textMuted} size={20} />
        </Pressable>
        {messages.length > 0 ? (
          <Pressable onPress={confirmClear} style={styles.iconButton} accessibilityRole="button">
            <TrashIcon color={theme.colors.textMuted} size={18} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
        keyboardVerticalOffset={0}
        style={styles.flex}>
        <FlatList
          data={data}
          keyExtractor={(item, index) => ('id' in item ? item.id : `meta-${index}`)}
          renderItem={renderItem}
          inverted
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, messages.length === 0 && !isPending && !error && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              {t('messagesEmpty')}
            </Text>
          }
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <AppInput
            placeholder={t('chatPlaceholder')}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            autoCapitalize="sentences"
            mic
            containerStyle={styles.input}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || isPending}
            accessibilityRole="button"
            accessibilityLabel={t('send')}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: !input.trim() || isPending ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}>
            <SendIcon color={theme.colors.onPrimary} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Historial de conversaciones: crear, navegar y borrar sesiones. */}
      <Modal visible={showSessions} transparent animationType="slide" onRequestClose={() => setShowSessions(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sessionsBackdrop}>
          <Pressable style={styles.backdropTouchable} onPress={() => setShowSessions(false)} />
          <Card style={styles.sessionsCard}>
            <View style={styles.sessionsHeader}>
              <Text style={[styles.sessionsTitle, { color: theme.colors.text }]}>
                {t('conversationsTitle')}
              </Text>
              <Button
                title={t('newConversation')}
                variant="primary"
                onPress={() => {
                  startSession();
                  setShowSessions(false);
                }}
                style={styles.newSessionButton}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.sessionsList}>
              {sessions.length === 0 ? (
                <Text style={[styles.sessionsEmpty, { color: theme.colors.textMuted }]}>
                  {t('noConversations')}
                </Text>
              ) : (
                sessions.map((session) => {
                  const active = session.id === activeSessionId;
                  return (
                    <Pressable
                      key={session.id}
                      onPress={() => {
                        setActiveSession(session.id);
                        setShowSessions(false);
                      }}
                      style={({ pressed }) => [
                        styles.sessionRow,
                        active && { backgroundColor: theme.colors.surfaceAlt },
                        pressed && styles.sessionRowPressed,
                      ]}>
                      <View style={styles.sessionText}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.sessionTitle,
                            { color: active ? theme.colors.primary : theme.colors.text },
                          ]}>
                          {session.title}
                        </Text>
                        <Text numberOfLines={1} style={[styles.sessionMeta, { color: theme.colors.textMuted }]}>
                          {session.messages.length} {t('messageCount')} · {new Date(session.updatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Pressable onPress={() => confirmDeleteSession(session)} hitSlop={8} style={styles.sessionDelete}>
                        <TrashIcon color={theme.colors.danger} size={18} />
                      </Pressable>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  provider: {
    fontSize: 13,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sessionsCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 28,
    width: '100%',
    maxHeight: '70%',
  },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  newSessionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sessionsList: {
    maxHeight: 420,
  },
  sessionsEmpty: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
  },
  sessionRowPressed: {
    opacity: 0.7,
  },
  sessionText: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionDelete: {
    padding: 6,
  },
});