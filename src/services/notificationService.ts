import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { uid } from '../utils/id';

const CHANNEL_ID = 'nova-reminders';
const ALARM_CHANNEL_ID = 'nova-alarms';

export { uid };

// Se configura el handler global de notificaciones para que,
// cuando la app esté en primer plano, el sistema las muestre igualmente.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function enableNotificationsChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5A67D8',
    });
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 300, 300],
      lightColor: '#E0454B',
      sound: 'default',
    });
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await enableNotificationsChannel();
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch (e) {
    console.warn('No se pudieron solicitar permisos de notificación', e);
    return false;
  }
}

// Programa una notificación local para una fecha dada.
// Devuelve el identificador asignado por expo-notifications.
export async function scheduleReminder(input: {
  title: string;
  body?: string;
  date: Date;
}): Promise<string | undefined> {
  try {
    const granted = await hasNotificationPermission();
    if (!granted) return undefined;
    await enableNotificationsChannel();

    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.date,
      channelId: CHANNEL_ID,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        sound: true,
      },
      trigger,
    });
    return id;
  } catch (e) {
    console.warn('No se pudo programar el recordatorio', e);
    return undefined;
  }
}

// Programa una alarma con mensaje personalizado en la fecha/hora indicada.
// Usa su propio canal Android (más sonoro) y devuelve el id de la notificación.
export async function scheduleAlarm(input: {
  message: string;
  date: Date;
}): Promise<string | undefined> {
  try {
    const granted = await hasNotificationPermission();
    if (!granted) return undefined;
    await enableNotificationsChannel();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alarm',
        body: input.message,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: input.date,
        channelId: ALARM_CHANNEL_ID,
      },
    });
    return id;
  } catch (e) {
    console.warn('No se pudo programar la alarma', e);
    return undefined;
  }
}

export async function cancelReminder(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('No se pudo cancelar el recordatorio', e);
  }
}