import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// ช่องกรอกแบบมีไอคอนด้านหน้า ตามแบบ Figma
// ช่องรหัสผ่าน (secureTextEntry) มีปุ่มรูปตาด้านขวาให้กดดูรหัสที่พิมพ์ได้
export default function AuthInput({ icon, secureTextEntry, value, ...inputProps }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const [visible, setVisible] = useState(false);
  // ตอนกดดูรหัส "ไม่ปิด" secureTextEntry — บน Android การสลับ secureTextEntry ทำให้ประเภทช่อง
  // เปลี่ยน แป้นพิมพ์เลยสลับภาษาเอง (เช่นเด้งเป็นไทย) → ให้ช่องเป็นรหัสผ่านตลอด
  // แล้วซ่อนจุดในช่อง (ตัวอักษรโปร่งใส) และแสดงรหัสจริงทับด้านบนแทน
  const showPlain = secureTextEntry && visible;
  return (
    <View style={styles.wrapper}>
      <Feather name={icon} size={18} color={colors.icon} style={styles.icon} />
      <View style={styles.inputBox}>
        <TextInput
          style={[styles.input, showPlain && styles.transparentText]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          // เคอร์เซอร์อิงตำแหน่งจุด ไม่ตรงกับตัวอักษรที่แสดงทับ — ซ่อนไว้ตอนกดดู
          caretHidden={showPlain}
          autoCapitalize={secureTextEntry ? 'none' : undefined}
          autoCorrect={secureTextEntry ? false : undefined}
          value={value}
          {...inputProps}
        />
        {showPlain ? (
          // ใช้ TextInput (แก้ไขไม่ได้) สไตล์เดียวกันแทน Text — ตัวอักษรจึงอยู่ตำแหน่งเดียวกับในช่องพอดี
          // (Text ธรรมดาบน Android จัดแนวตั้งไม่ตรงกับ TextInput) · selection ท้ายสุด = รหัสยาวแล้วเห็นตัวท้าย
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <TextInput
              style={styles.input}
              value={value}
              editable={false}
              focusable={false}
              selection={{ start: value?.length ?? 0, end: value?.length ?? 0 }}
              importantForAccessibility="no"
            />
          </View>
        ) : null}
      </View>
      {secureTextEntry ? (
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          <Feather name={visible ? 'eye-off' : 'eye'} size={18} color={colors.icon} />
        </TouchableOpacity>
      ) : null}
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
    inputBox: { flex: 1, height: '100%', justifyContent: 'center' },
    // padding 0 ให้ช่องที่แสดงรหัสทับอยู่ตำแหน่งเดียวกับช่องจริง
    input: { flex: 1, height: '100%', color: c.text, fontSize: 14, paddingHorizontal: 0, paddingVertical: 0 },
    transparentText: { color: 'transparent' },
  });
