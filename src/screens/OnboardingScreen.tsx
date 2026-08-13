import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyIcon } from '../components/icons';
import { NovaLogo } from '../components/NovaLogo';
import { AppInput } from '../components/ui/AppInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useI18n } from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../theme';
import { AI_PROVIDER_ORDER } from '../types';
import { PROVIDER_KEYS } from '../utils/providers';

export function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const provider = useSettingsStore((s) => s.provider);
  const setProvider = useSettingsStore((s) => s.setProvider);
  const saveApiKey = useSettingsStore((s) => s.saveApiKey);

  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      // Guarda la clave de forma segura (SecureStore) y desbloquea la app.
      await saveApiKey(apiKey);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.logo, { backgroundColor: theme.colors.surface }]}>
            <NovaLogo size={48} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('appName')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {t('onboardingSubtitle')}
          </Text>

          <Card style={styles.card}>
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
                    style={[
                      styles.providerButton,
                      active && { borderColor: theme.colors.primary },
                    ]}
                  />
                );
              })}
            </View>

            <Text
              style={[
                styles.fieldLabel,
                { color: theme.colors.text, marginTop: 20 },
              ]}>
              {t('apiKeyLabel')}
            </Text>
            <AppInput
              placeholder={t('apiKeyPlaceholder')}
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              icon={<KeyIcon color={theme.colors.textMuted} size={18} />}
            />

            <Button
              title={t('continue')}
              onPress={handleSave}
              loading={saving}
              disabled={!apiKey.trim()}
              style={styles.submit}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 32,
  },
  card: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerButton: {
    flexGrow: 1,
    flexBasis: '47%',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  submit: {
    marginTop: 24,
  },
});