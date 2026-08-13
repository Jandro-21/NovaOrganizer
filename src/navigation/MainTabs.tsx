import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getTabIcon } from '../components/icons';
import { useI18n } from '../i18n';
import { AlarmScreen } from '../screens/AlarmScreen';
import { BoardScreen } from '../screens/BoardScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TimerScreen } from '../screens/TimerScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { useTheme } from '../theme';

export type MainTabParamList = {
  Board: undefined;
  Todo: undefined;
  Alarms: undefined;
  Timer: undefined;
  Chat: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const theme = useTheme();
  const { t } = useI18n();

  const tabStyles = {
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarStyle: {
      backgroundColor: theme.colors.tabBar,
      borderTopColor: theme.colors.border,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
    headerShown: false,
  };

  return (
    <Tab.Navigator screenOptions={tabStyles}>
      <Tab.Screen
        name="Board"
        component={BoardScreen}
        options={{
          title: t('tabBoard'),
          tabBarIcon: ({ color }) => getTabIcon('board', color),
        }}
      />
      <Tab.Screen
        name="Todo"
        component={TodoScreen}
        options={{
          title: t('tabTodo'),
          tabBarIcon: ({ color }) => getTabIcon('todo', color),
        }}
      />
      <Tab.Screen
        name="Alarms"
        component={AlarmScreen}
        options={{
          title: t('tabAlarms'),
          tabBarIcon: ({ color }) => getTabIcon('alarms', color),
        }}
      />
      <Tab.Screen
        name="Timer"
        component={TimerScreen}
        options={{
          title: t('tabTimer'),
          tabBarIcon: ({ color }) => getTabIcon('timer', color),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: t('tabChat'),
          tabBarIcon: ({ color }) => getTabIcon('chat', color),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('tabSettings'),
          tabBarIcon: ({ color }) => getTabIcon('settings', color),
        }}
      />
    </Tab.Navigator>
  );
}