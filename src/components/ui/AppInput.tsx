import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { DictationButton } from '../DictationButton';

interface AppInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
  mic?: boolean;
}

export function AppInput({ containerStyle, style, icon, mic = false, ...rest }: AppInputProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceAlt },
        containerStyle,
      ]}>
      {icon}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          { color: theme.colors.text },
          style,
        ]}
        {...rest}
      />
      {mic ? <DictationButton onText={(text) => rest.onChangeText?.(text)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 50,
  },
});