import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EbookScreen from '../screens/ebook/EbookScreen';
import EbookCategoryScreen from '../screens/ebook/EbookCategoryScreen';
import EbookSearchScreen from '../screens/ebook/EbookSearchScreen';
import EbookDetailScreen from '../screens/ebook/EbookDetailScreen';
import PdfReaderScreen from '../screens/ebook/PdfReaderScreen';
import FavoriteScreen from '../screens/ebook/FavoriteScreen';
import MenuButton from '../components/MenuButton';
import { useStackScreenOptions } from './stackOptions';
import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();

// Use Case: Reading
export default function EbookNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="EbookHome"
        component={EbookScreen}
        options={{ title: t('nav.ebook'), headerLeft: () => <MenuButton /> }}
      />
      <Stack.Screen name="EbookCategory" component={EbookCategoryScreen} options={({ route }) => ({ title: route.params.title })} />
      <Stack.Screen name="EbookSearch" component={EbookSearchScreen} options={{ headerShown: false, title: t('nav.search') }} />
      <Stack.Screen name="EbookDetail" component={EbookDetailScreen} options={{ title: t('nav.ebookDetails') }} />
      <Stack.Screen name="PdfReader" component={PdfReaderScreen} />
      <Stack.Screen name="EbookFavorites" component={FavoriteScreen} options={{ title: t('nav.favorite') }} />
    </Stack.Navigator>
  );
}
