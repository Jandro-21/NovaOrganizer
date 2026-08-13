import Constants from 'expo-constants';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BellIcon,
  CheckIcon,
  GlobeIcon,
  KeyIcon,
  SparkleIcon,
  SunIcon,
} from '../components/icons';
import { AppInput } from '../components/ui/AppInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { SectionTitle, SettingRow } from '../components/ui/SettingRow';
import { NovaLogo } from '../components/NovaLogo';
import { useI18n } from '../i18n';
import {
  ensureNotificationPermission,
  hasNotificationPermission,
} from '../services/notificationService';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../theme';
import { AI_PROVIDER_ORDER, type AppLanguage, type ThemeMode } from '../types';
import { PROVIDER_KEYS } from '../utils/providers';

const THEME_OPTIONS: { value: ThemeMode; labelKey: string }[] = [
  { value: 'light', labelKey: 'themeLight' },
  { value: 'dark', labelKey: 'themeDark' },
  { value: 'system', labelKey: 'themeSystem' },
];

const LANGUAGE_OPTIONS: { value: AppLanguage; labelKey: string }[] = [
  { value: 'en', labelKey: 'langEnglish' },
  { value: 'es', labelKey: 'langSpanish' },
];

interface OptionsModalProps {
  visible: boolean;
  title: string;
  options: { value: string; labelKey: string }[];
  current: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function OptionsModal({ visible, title, options, current, onSelect, onClose }: OptionsModalProps) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Card style={styles.optionsCard}>
          <Text style={[styles.optionsTitle, { color: theme.colors.text }]}>{title}</Text>
          {options.map((opt) => {
            const active = opt.value === current;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onSelect(opt.value)}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionPressed,
                ]}>
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  {t(opt.labelKey)}
                </Text>
                {active ? <CheckIcon color={theme.colors.primary} size={18} /> : null}
              </Pressable>
            );
          })}
        </Card>
      </Pressable>
    </Modal>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const { t, language } = useI18n();

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const provider = useSettingsStore((s) => s.provider);
  const setProvider = useSettingsStore((s) => s.setProvider);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const saveApiKey = useSettingsStore((s) => s.saveApiKey);
  const deleteApiKey = useSettingsStore((s) => s.deleteApiKey);

  const [notifGranted, setNotifGranted] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const refreshPermission = useCallback(async () => {
    setNotifGranted(await hasNotificationPermission());
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  async function handleRequestPermission() {
    const granted = await ensureNotificationPermission();
    await refreshPermission();
    if (!granted) {
      Alert.alert(t('notificationsManagement'), t('permissionNeeded'));
    }
  }

  function confirmDeleteKey() {
    Alert.alert(t('deleteApiKey'), t('deleteApiKeyConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deleteApiKey'), style: 'destructive', onPress: () => deleteApiKey() },
    ]);
  }

  async function handleSaveKey() {
    if (!newApiKey.trim()) return;
    setSavingKey(true);
    try {
      await saveApiKey(newApiKey);
      setNewApiKey('');
      setShowApiKeyModal(false);
    } finally {
      setSavingKey(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <NovaLogo size={34} style={styles.logo} />
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('settingsTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* IA: clave y proveedor. */}
        <Card>
          <SectionTitle>{t('sectionAssistant')}</SectionTitle>
          <SettingRow
            label={t('providerLabel')}
            value={t(PROVIDER_KEYS[provider])}
            icon={<SparkleIcon color={theme.colors.textMuted} size={20} />}
            onPress={() => setShowApiKeyModal(true)}
          />
          <SettingRow
            label={t('apiKeyLabel')}
            value={apiKey ? t('apiKeySet') : t('apiKeyEmpty')}
            icon={<KeyIcon color={theme.colors.textMuted} size={20} />}
            onPress={() => setShowApiKeyModal(true)}
          />
        </Card>

        {/* Notificaciones. */}
        <Card>
          <SectionTitle>{t('sectionNotifications')}</SectionTitle>
          <SettingRow
            label={t('notificationsManagement')}
            value={notifGranted ? t('notificationsGranted') : t('notificationsDenied')}
            icon={<BellIcon color={theme.colors.textMuted} size={20} />}
            right={
              !notifGranted ? (
                <Button
                  title={t('requestPermission')}
                  variant="secondary"
                  onPress={handleRequestPermission}
                  style={styles.requestButton}
                />
              ) : null
            }
          />
        </Card>

        {/* Apariencia y preferencias. */}
        <Card>
          <SectionTitle>{t('sectionAppearance')}</SectionTitle>
          <SettingRow
            label={t('appearanceTheme')}
            value={t(themeMode === 'system' ? 'themeSystem' : themeMode === 'dark' ? 'themeDark' : 'themeLight')}
            icon={<SunIcon color={theme.colors.textMuted} size={20} />}
            onPress={() => setShowThemeModal(true)}
          />
          <SettingRow
            label={t('languageLabel')}
            value={language === 'es' ? t('langSpanish') : t('langEnglish')}
            icon={<GlobeIcon color={theme.colors.textMuted} size={20} />}
            onPress={() => setShowLanguageModal(true)}
          />
        </Card>

        {/* Información de la app. */}
        <Card>
          <SectionTitle>{t('appName')}</SectionTitle>
          <View style={styles.appInfo}>
            <NovaLogo size={48} />
            <View style={styles.appInfoText}>
              <Text style={[styles.appName, { color: theme.colors.text }]}>{t('appName')}</Text>
              <Text style={[styles.appVersion, { color: theme.colors.textMuted }]}>
                {t('versionLabel')} {Constants.expoConfig?.version ?? '1.0.0'}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      <OptionsModal
        visible={showThemeModal}
        title={t('appearanceTheme')}
        options={THEME_OPTIONS}
        current={themeMode}
        onSelect={(v) => {
          setThemeMode(v as ThemeMode);
          setShowThemeModal(false);
        }}
        onClose={() => setShowThemeModal(false)}
      />

      <OptionsModal
        visible={showLanguageModal}
        title={t('languageLabel')}
        options={LANGUAGE_OPTIONS}
        current={language}
        onSelect={(v) => {
          setLanguage(v as AppLanguage);
          setShowLanguageModal(false);
        }}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Modal para editar la API Key / proveedor. */}
      <Modal
        visible={showApiKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApiKeyModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowApiKeyModal(false)}>
          <Card style={styles.apiKeyCard}>
            <Text style={[styles.optionsTitle, { color: theme.colors.text }]}>
              {t('updateApiKey')}
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
              {t('providerLabel')}
            </Text>
            <View style={styles.providerRow}>
              {AI_PROVIDER_ORDER.map((p) => {
                const active = provider === p;
                return (
                  <Button
                    key={p}
                    title={t(PROVIDER_KEYS[p])}
                    variant={active ? 'primary' : 'ghost'}
                    onPress={() => setProvider(p)}
                    style={styles.providerButton}
                  />
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}>
              {t('apiKeyLabel')}
            </Text>
            <AppInput
              placeholder={t('apiKeyPlaceholder')}
              value={newApiKey}
              onChangeText={setNewApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />

            <View style={styles.apiKeyActions}>
              <Button
                title={t('deleteApiKey')}
                variant="danger"
                onPress={confirmDeleteKey}
                style={styles.apiKeyButton}
              />
              <Button
                title={t('save')}
                onPress={handleSaveKey}
                loading={savingKey}
                disabled={!newApiKey.trim()}
                style={styles.apiKeyButton}
              />
            </View>
          </Card>
        </Pressable>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appInfoText: {
    flex: 1,
  },
  appName: {
    fontSize: 17,
    fontWeight: '700',
  },
  appVersion: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  optionsCard: {
    width: '100%',
  },
  optionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionLabel: {
    fontSize: 15,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerButton: {
    flexGrow: 1,
    flexBasis: '31%',
    paddingVertical: 10,
  },
  apiKeyCard: {
    width: '100%',
  },
  apiKeyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  apiKeyButton: {
    flex: 1,
    paddingVertical: 12,
  },
});