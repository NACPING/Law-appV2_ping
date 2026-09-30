import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import CommunityNavigator from './CommunityNavigator';
import EbookNavigator from './EbookNavigator';
import ChatNavigator from './ChatNavigator';
import ProfileNavigator from './ProfileNavigator';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import HelpScreen from '../screens/profile/HelpScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';
import { useTheme } from '../context/ThemeContext';
import { useStackScreenOptions } from './stackOptions';
import { useLanguage } from '../context/LanguageContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Community: 'earth',
  'E-Book': 'book',
  Chat: 'chatbubble-ellipses',
  Profile: 'person',
};

// หน้าที่ใช้พื้นที่เต็มจอ (ห้องแชท, ตัวอ่าน PDF) ซ่อนแถบเมนูด้านล่าง
const FULL_SCREEN_ROUTES = ['ChatRoom', 'ChatFile', 'PdfReader'];

function MainTabs() {
  const { colors } = useTheme();
  const tabBarStyle = { backgroundColor: colors.primary, borderTopWidth: 0 };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.onPrimary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarHideOnKeyboard: true, // ไม่ให้แถบเมนูลอยขึ้นมาทับช่องพิมพ์บน Android
        tabBarStyle: FULL_SCREEN_ROUTES.includes(getFocusedRouteNameFromRoute(route))
          ? { display: 'none' }
          : tabBarStyle,
        tabBarIcon: ({ focused, color, size }) => {
          const base = TAB_ICONS[route.name];
          return <Ionicons name={focused ? base : `${base}-outline`} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Community" component={CommunityNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="E-Book" component={EbookNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Chat" component={ChatNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// หน้าหลักหลังล็อกอิน: แท็บทั้งหมด + หน้าที่เปิดได้จากทุกแท็บ
// (การแจ้งเตือน = กระดิ่งมุมขวา, Settings และหน้าย่อย = ปุ่ม ☰ มุมซ้าย)
export default function AppNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('nav.notification') }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('nav.settings') }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: t('nav.editProfile') }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('nav.privacy') }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: t('nav.help') }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: t('nav.language') }} />
    </Stack.Navigator>
  );
}
