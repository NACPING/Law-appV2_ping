import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';
import PostReactionsScreen from '../screens/community/PostReactionsScreen';
import MenuButton from '../components/MenuButton';
import { useStackScreenOptions } from './stackOptions';
import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();

// แท็บ Profile: โปรไฟล์ของตัวเอง (Settings อยู่ใน AppNavigator เพราะเปิดได้จากทุกแท็บ)
// PostDetail/UserProfile อยู่ในแท็บนี้ด้วย เพื่อให้แตะโพสต์/ชื่อคนในโปรไฟล์แล้วไม่ต้องสลับแท็บ
export default function ProfileNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ProfileHome"
        component={UserProfileScreen}
        options={{ title: t('nav.profile'), headerLeft: () => <MenuButton /> }}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: t('nav.profile') }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="FollowList" component={FollowListScreen} options={{ title: '' }} />
      <Stack.Screen name="PostReactions" component={PostReactionsScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
