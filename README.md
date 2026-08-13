# NovaOrganizer

Aplicación móvil de productividad con IA construida con **React Native + Expo (SDK 57)**, **TypeScript estricto** y **React Navigation**. Incluye un tablero de brainstorming (corcho) con acciones de IA, un gestor de tareas con recordatorios, un modo de alarmas con notificaciones personalizadas, un chatbot con historial de conversaciones y conciencia del estado global, dictado por voz (speech-to-text) en todos los inputs, y ajustes con tema claro/oscuro e idioma EN/ES. **Cero emojis: todos los iconos son SVG en línea.**

## Requisitos

- Node.js 20+ y npm
- [Expo Go](https://expo.dev/go) en el dispositivo (Android/iOS) o un emulador

## Instalación

```bash
npm install
```

## Ejecución (Expo Go)

```bash
npm start
```

Escanea el código QR con Expo Go (o pulsa `a` para abrir en emulador Android). También puedes compilar un `.apk` desde [Expo Dev / EAS](https://expo.dev/eas) o con `npx expo run:android` si tienes Android Studio.

## Dependencias exactas

```bash
npx expo install expo @react-native-async-storage/async-storage @react-native-community/datetimepicker @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs expo-notifications expo-secure-store expo-constants expo-status-bar expo-audio expo-asset react-native-safe-area-context react-native-screens react-native-svg
npm install zustand
```

- **Estado global:** `zustand` (tema, idioma, tareas, notas, alarmas y sesiones de chat) con persistencia en `AsyncStorage`.
- **API Key segura:** `expo-secure-store` (BYOK — Bring Your Own Key).
- **Recordatorios y alarmas:** `expo-notifications` + `@react-native-community/datetimepicker`.
- **Dictado por voz:** `expo-audio` (grabación) conectado al endpoint de transcripción (Whisper de OpenAI / Groq) del proveedor activo. `expo-av` NO existe en SDK 57; su reemplazo oficial es `expo-audio`.
- **Safe areas / responsive:** `react-native-safe-area-context` + `Dimensions.get('window')`.
- **Iconos:** `react-native-svg` (sin emojis, todos los iconos son SVG en línea).
- **i18n:** diccionarios propios EN/ES (sin librería externa).

## Estructura

```
App.tsx                      → SafeAreaProvider + RootNavigator + StatusBar
src/
  navigation/
    RootNavigator.tsx        → Stack de navegación + gating de onboarding (API Key)
    MainTabs.tsx             → Tab Navigator (Board, Todo, Alarms, Chat, Settings)
  screens/
    OnboardingScreen.tsx     → Selección de proveedor (BYOK) + guardado de API Key
    BoardScreen.tsx          → Corcho responsive (Masonry) + long-press + acciones IA
    TodoScreen.tsx           → CRUD de tareas + fecha/hora + recordatorio local
    AlarmScreen.tsx          → Alarmas con notificaciones locales personalizadas
    ChatScreen.tsx           → Chat IA con sesiones + contexto global + dictado
    SettingsScreen.tsx       → Idioma, tema, proveedor, API Key, permisos
  components/
    icons/                   → Iconos SVG en línea (mic, alarma, selección, etc.)
    ui/                      → Screen, Button, AppInput, Card, SettingRow
    TaskModal.tsx            → Modal de creación/edición de tareas (con mic)
    AlarmModal.tsx           → Modal de creación/edición de alarmas (con mic)
    DictationButton.tsx      → Botón de dictado por voz (expo-audio + Whisper)
  stores/                    → Stores Zustand (settings, tasks, board, alarms, chat)
  services/
    aiService.ts             → Adaptador OpenAI / Anthropic / Gemini / Groq / OpenRouter + transcripción
    contextDump.ts           → Volcado del estado global (tareas/notas/alarmas) para el chat
    notificationService.ts   → Permisos, canales Android y notificaciones locales
  theme/                     → Paletas claro/oscuro y hook useTheme()
  i18n/                      → Diccionarios EN/ES y hook useI18n()
  types/                     → Tipos globales de dominio
  utils/                     → id.ts (ids), providers.ts (etiquetas de proveedores)
```

## Integración con IA (BYOK)

En `src/services/aiService.ts` se define un adaptador por proveedor
(endpoint, encabezados, formato de cuerpo y parseo de respuesta):

- **OpenAI** — `POST /v1/chat/completions` (`Authorization: Bearer <key>`)
- **Anthropic** — `POST /v1/messages` (`x-api-key` + `anthropic-version`)
- **Gemini** — `POST generateContent` (clave como `?key=` en la URL)
- **Groq** — `POST /openai/v1/chat/completions` (compatible con OpenAI)
- **OpenRouter** — `POST /api/v1/chat/completions` (compatible con OpenAI)

El proveedor se elige en Onboarding y Ajustes. El chat usa sesiones con historial
completo guardado en `AsyncStorage` y alimenta al modelo con los últimos 20 mensajes.

### Conciencia de contexto global

`src/services/contextDump.ts` genera un system prompt oculto con un volcado de
texto de las **tareas**, **notas del corcho** y **alarmas** actuales, para que la IA
responda con precisión a preguntas como "¿Qué tareas tengo para hoy?", "¿Qué notas
tengo en el corcho?" o "¿A qué hora es mi alarma?".

### Dictado por voz

`DictationButton` graba con `expo-audio` (`RecordingPresets.HIGH_QUALITY`) y envía
el clip al endpoint de transcripción del proveedor activo (`transcribeAudio`).
Soporte actual: **OpenAI (whisper-1)** y **Groq (whisper-large-v3)**. Disponible en
los inputs de notas del corcho, tareas, chat y alarmas. Requiere la API Key y el
permiso de micrófono (configurado en `app.json` con el plugin `expo-audio`).

## Notificaciones

- `notificationService.ts` define el handler global, los canales Android
  (`nova-reminders` para tareas y `nova-alarms` para alarmas), la petición de
  permisos y la programación/cancelación con `expo-notifications`.
- `app.json` incluye los plugins `expo-notifications` y `expo-audio`.
- Al crear/editar una tarea se puede elegir fecha/hora y recordatorio; las alarmas
  programan una notificación con mensaje personalizado en la fecha exacta elegida.

## Scripts

```bash
npm start            # Inicia Metro / Expo Dev Server
npm run android      # Abre en emulador Android
npm run ios          # Abre en simulador iOS
npm run web          # Versión web
npx tsc --noEmit     # Typecheck estricto
npx expo-doctor      # Valida compatibilidad de dependencias
```
