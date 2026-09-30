import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

// ช่องกรอกแบบมีไอคอนด้านหน้า ตามแบบ Figma
export default function AuthInput({ icon, ...inputProps }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrapper}>
      <Feather name={icon} size={18} color={colors.icon} style={styles.icon} />
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...inputProps} />
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      height: 48,
      marginBottom: 12,
      // เงาเล็กน้อยให้เหมือนช่องใน Figma
      shadowColor: c.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    icon: { marginRight: 10, width: 20, textAlign: 'center' },
    input: { flex: 1, height: '100%', color: c.text, fontSize: 14 },
  });
