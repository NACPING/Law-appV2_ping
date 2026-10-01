import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

// แถวสวิตช์ในหน้าตั้งค่า: ชื่อ + คำอธิบาย + สวิตช์ — แตะได้ทั้งแถว (สวิตช์เล็กกดยากบนมือถือ)
export default function SettingSwitch({ label, hint, value, onValueChange, disabled = false }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.disabled]}
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      activeOpacity={0.6}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
    >
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      marginTop: -StyleSheet.hairlineWidth,
    },
    disabled: { opacity: 0.6 },
    text: { flex: 1, marginRight: 12 },
    label: { fontSize: 14, color: c.text },
    hint: { fontSize: 12, color: c.textMuted, marginTop: 3, lineHeight: 17 },
  });
