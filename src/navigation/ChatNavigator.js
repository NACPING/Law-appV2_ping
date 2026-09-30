import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import ChatScreen from '../screens/chat/ChatScreen';
import RequestListScreen from '../screens/chat/RequestListScreen';
import ConsultFormScreen from '../screens/chat/ConsultFormScreen';
import RequestStatusScreen from '../screens/chat/RequestStatusScreen';
import AdminReviewScreen from '../screens/chat/AdminReviewScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import ChatFileScreen from '../screens/chat/ChatFileScreen';
import BellButton from '../components/BellButton';
import MenuButton from '../components/MenuButton';
import { useStackScreenOptions } from './stackOptions';
import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();

// Use Case: Lawyer_request + Chat
export default function ChatNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  const { user } = useAuth();
  const homeTitle = user?.role === 'ADMIN' ? t('nav.adminRequests') : t('nav.message');

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ChatHome"
        component={ChatScreen}
        options={{ title: homeTitle, headerLeft: () => <MenuButton />, headerRight: () => <BellButton /> }}
      />
      <Stack.Screen name="RequestList" component={RequestListScreen} options={{ title: t('nav.requestList') }} />
      <Stack.Screen name="ConsultForm" component={ConsultFormScreen} options={{ title: t('nav.consultWithUs') }} />
      <Stack.Screen name="RequestStatus" component={RequestStatusScreen} options={{ title: t('nav.consultWithUs') }} />
      <Stack.Screen name="AdminReview" component={AdminReviewScreen} options={{ title: t('nav.adminReview') }} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: t('nav.chat') }} />
      <Stack.Screen name="ChatFile" component={ChatFileScreen} options={{ title: t('nav.file') }} />
    </Stack.Navigator>
  );
}
