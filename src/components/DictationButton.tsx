import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { transcribeAudio } from '../services/aiService';
import { useI18n } from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../theme';
import { MicIcon } from './icons';

interface DictationButtonProps {
  onText: (text: string) => void;
  color?: string;
  size?: number;
}

// Botón de dictado por voz (Speech-to-Text). Graba con expo-audio y envía
// el clip al endpoint de transcripción del proveedor de IA activo (Whisper).
export function DictationButton({ onText, color, size = 20 }: DictationButtonProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const provider = useSettingsStore((s) => s.provider);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [transcribing, setTranscribing] = useState(false);
  const [busy, setBusy] = useState(false);

  const tint = color ?? theme.colors.textMuted;

  // Solicita permiso de micrófono y prepara el modo de grabación.
  const ensureReady = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(t('dictationTitle'), t('microphoneDenied'));
        return false;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      return true;
    } catch (e) {
      console.warn('No se pudo preparar la grabación', e);
      Alert.alert(t('dictationTitle'), t('dictationError'));
      return false;
    }
  }, [recorder, t]);

  const start = useCallback(async () => {
    if (!apiKey) {
      Alert.alert(t('dictationTitle'), t('apiKeyNeededForDictation'));
      return;
    }
    if (!(await ensureReady())) return;
    try {
      recorder.record();
    } catch (e) {
      console.warn('No se pudo iniciar la grabación', e);
      Alert.alert(t('dictationTitle'), t('dictationError'));
    }
  }, [ensureReady, recorder, t, apiKey]);

  const stopAndTranscribe = useCallback(async () => {
    if (transcribing || busy) return;
    setBusy(true);
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch (e) {
      console.warn('No se pudo detener la grabación', e);
    }
    if (!uri) {
      setBusy(false);
      return;
    }

    setTranscribing(true);
    const res = await transcribeAudio({ provider, apiKey, uri });
    setTranscribing(false);
    setBusy(false);

    if (res.error) {
      Alert.alert(t('dictationTitle'), res.error);
    } else {
      onText(res.content);
    }
  }, [recorder, provider, apiKey, onText, transcribing, busy, t]);

  const handlePress = useCallback(() => {
    if (recorderState.isRecording) {
      stopAndTranscribe();
    } else {
      start();
    }
  }, [recorderState.isRecording, start, stopAndTranscribe]);

  if (transcribing) {
    return (
      <Pressable style={styles.button} accessibilityRole="button" accessibilityLabel={t('dictating')}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={recorderState.isRecording ? t('stopDictation') : t('startDictation')}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        recorderState.isRecording && { backgroundColor: theme.colors.danger + '22' },
      ]}>
      <MicIcon color={recorderState.isRecording ? theme.colors.danger : tint} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});