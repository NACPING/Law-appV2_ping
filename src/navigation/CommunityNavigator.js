import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityScreen from '../screens/community/CommunityScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';
import CreatePostScreen from '../screens/community/CreatePostScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';
import MenuButton from '../components/MenuButton';
import { useStackScreenOptions } from './stackOptions';
import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();

export default function CommunityNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Feed"
        component={CommunityScreen}
        options={{ title: t('nav.communication'), headerLeft: () => <MenuButton /> }}
      />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: t('nav.createPost') }} />
      {/* แตะชื่อผู้เขียนโพสต์/คอมเมนต์ → โปรไฟล์ของคนนั้น */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: t('nav.profile') }} />
      <Stack.Screen name="FollowList" component={FollowListScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
