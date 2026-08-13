import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NovaLogo } from '../components/NovaLogo';
import { Stopwatch } from '../components/Stopwatch';
import { Screen } from '../components/ui/Screen';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

export function TimerScreen() {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <Screen>
      <View style={styles.header}>
        <NovaLogo size={34} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('timerTitle')}</Text>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{t('timerHint')}</Text>
        </View>
      </View>
      <Stopwatch />
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
    marginTop: 2,
  },
});
