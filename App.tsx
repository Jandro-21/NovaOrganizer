import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useTheme } from './src/theme';

export default function App() {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}