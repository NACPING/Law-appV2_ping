import React, { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

// ดูรูปเต็มจอ ปัดซ้าย-ขวาเพื่อเปลี่ยนรูป
export default function ImageViewer({ images, startIndex, onClose }) {
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(startIndex ?? 0);
  const visible = startIndex !== null && startIndex !== undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {visible && (
          <FlatList
            data={images}
            keyExtractor={(uri) => uri}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={startIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={100}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height }} resizeMode="contain" />
            )}
          />
        )}
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Text style={styles.counter}>
            {index + 1} / {images.length}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel={t('common.closeImage')}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: { color: '#fff', fontSize: 14 },
});
