import React, { useEffect, useState } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { NovaLogo } from '../components/NovaLogo';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../theme';
import { MainTabs } from './MainTabs';

export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
};

export type { MainTabParamList } from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const loadApiKey = useSettingsStore((s) => s.loadApiKey);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const [ready, setReady] = useState(false);

  // Carga la API Key guardada en SecureStore antes de decidir qué pantalla mostrar.
  useEffect(() => {
    loadApiKey().finally(() => setReady(true));
  }, [loadApiKey]);

  if (!ready) {
    return <Splash />;
  }

  const navTheme: NavTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Si no hay API Key se muestra el onboarding, en caso contrario la app principal. */}
        {!apiKey ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Splash() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <NovaLogo size={120} />
    </View>
  );
}