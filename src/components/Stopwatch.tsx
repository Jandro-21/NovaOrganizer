import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useStopwatch, type StopwatchLap } from '../hooks/useStopwatch';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { FlagIcon, PauseIcon, PlayIcon, ResetIcon } from './icons';
import { Button } from './ui/Button';

export function formatStopwatch(ms: number): string {
  const total = Math.max(0, ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const centis = Math.floor((total % 1000) / 10);
  const base = `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
  return hours > 0 ? `${pad(hours)}:${base}` : base;
}

// Cronómetro minimalista integrado con el tema de la app.
// Controles: Iniciar/Pausar, Reiniciar y guardar vueltas (laps).
export function Stopwatch() {
  const theme = useTheme();
  const { t } = useI18n();
  const { elapsed, running, laps, start, pause, reset, lap } = useStopwatch();

  const lapsNewestFirst: StopwatchLap[] = laps.slice().reverse();

  return (
    <View style={styles.container}>
      <Text style={[styles.time, { color: theme.colors.text }]}>{formatStopwatch(elapsed)}</Text>

      <View style={styles.controls}>
        <Button
          title={t('timerReset')}
          variant="ghost"
          onPress={reset}
          disabled={elapsed === 0}
          icon={<ResetIcon color={theme.colors.textMuted} size={18} />}
          style={styles.controlButton}
        />
        <Button
          title={running ? t('timerPause') : t('timerStart')}
          onPress={running ? pause : start}
          icon={
            running ? (
              <PauseIcon color={theme.colors.onPrimary} size={18} />
            ) : (
              <PlayIcon color={theme.colors.onPrimary} size={18} />
            )
          }
          style={styles.mainButton}
        />
        <Button
          title={t('timerLap')}
          variant="secondary"
          onPress={lap}
          disabled={!running}
          icon={<FlagIcon color={theme.colors.textMuted} size={18} />}
          style={styles.controlButton}
        />
      </View>

      <View style={styles.lapsHeader}>
        <Text style={[styles.lapsTitle, { color: theme.colors.textMuted }]}>
          {t('timerLaps')}
        </Text>
      </View>

      {laps.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{t('timerNoLaps')}</Text>
      ) : (
        <FlatList
          data={lapsNewestFirst}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View
              style={[styles.lapRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.lapIndex, { color: theme.colors.textMuted }]}>
                {t('timerLapCount', { count: laps.length - index })}
              </Text>
              <Text style={[styles.lapDuration, { color: theme.colors.text }]}>
                {formatStopwatch(item.duration)}
              </Text>
              <Text style={[styles.lapTotal, { color: theme.colors.textMuted }]}>
                {formatStopwatch(item.total)}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lapsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  time: {
    fontSize: 64,
    fontWeight: '300',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
    alignItems: 'center',
  },
  controlButton: {
    flex: 1,
    paddingVertical: 14,
  },
  mainButton: {
    flex: 1.2,
    paddingVertical: 16,
  },
  lapsHeader: {
    marginTop: 28,
    marginBottom: 6,
  },
  lapsTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  empty: {
    textAlign: 'center',
    paddingTop: 40,
    fontSize: 15,
  },
  lapsList: {
    gap: 2,
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lapIndex: {
    width: 64,
    fontSize: 14,
    fontWeight: '500',
  },
  lapDuration: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  lapTotal: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});
