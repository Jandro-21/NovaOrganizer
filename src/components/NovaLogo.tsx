import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

interface NovaLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

// Logo oficial de Nova (assets/logonova.png). Se reutiliza en la pantalla
// de carga, en las cabeceras de las pantallas principales y en Ajustes.
export function NovaLogo({ size = 96, style }: NovaLogoProps) {
  return (
    <Image
      source={require('../../assets/logonova.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
