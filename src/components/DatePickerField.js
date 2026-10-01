import React, { useMemo, useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

// ช่องเลือกวันที่ (วันเกิด) — แตะแล้วเลือก วัน / เดือน / ปี จาก 3 คอลัมน์ ไม่ต้องพิมพ์เอง
// ทำเองแทนปฏิทินของระบบ: ปฏิทิน Android เลื่อนไปปีเกิดที่ห่างหลายสิบปีลำบาก และให้หน้าตาเหมือนกันทุกแพลตฟอร์ม
// value / onChange ใช้รูปแบบ 'YYYY-MM-DD' (ค.ศ.) ตามที่ backend รับ · โหมดไทยแสดงปีเป็น พ.ศ.
const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const YEARS_BACK = 100;

const daysInMonth = (year, month) => new Date(year, month, 0).getDate(); // month 1-12
const pad = (n) => String(n).padStart(2, '0');

function parse(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}

export default function DatePickerField({ value, onChange, placeholder, icon = 'calendar' }) {
  const { t, lang } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const today = new Date();
  const thisYear = today.getFullYear();
  const months = t('date.months'); // ชื่อเดือนตามภาษา (array 12 ตัว)
  const showYear = (y) => (lang === 'th' ? y + 543 : y);

  const selected = parse(value);
  const label = selected ? `${selected.d} ${months[selected.m - 1]} ${showYear(selected.y)}` : '';

  const openPicker = () => {
    Keyboard.dismiss(); // ช่องนี้ไม่ใช่ช่องพิมพ์ — เก็บคีย์บอร์ดของช่องก่อนหน้า
    // ยังไม่เคยเลือก → เริ่มที่ 1 ม.ค. ของ 20 ปีก่อน (ใกล้อายุผู้ใช้ส่วนใหญ่ เลื่อนน้อย)
    setDraft(selected ?? { y: thisYear - 20, m: 1, d: 1 });
    setOpen(true);
  };

  // เปลี่ยนเดือน/ปีแล้ววันเกินจำนวนวันของเดือนนั้น (เช่น 31 → ก.พ.) ให้ปรับเป็นวันสุดท้ายของเดือน
  const update = (patch) =>
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      return { ...next, d: Math.min(next.d, daysInMonth(next.y, next.m)) };
    });

  const isFuture = draft && new Date(draft.y, draft.m - 1, draft.d) > today;

  const confirm = () => {
    onChange(`${draft.y}-${pad(draft.m)}-${pad(draft.d)}`);
    setOpen(false);
  };

  const years = useMemo(() => Array.from({ length: YEARS_BACK + 1 }, (_, i) => thisYear - i), [thisYear]);
  const days = draft ? Array.from({ length: daysInMonth(draft.y, draft.m) }, (_, i) => i + 1) : [];
  const monthNumbers = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={openPicker}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label ? `${placeholder}: ${label}` : placeholder}
      >
        <Feather name={icon} size={18} color={colors.icon} style={styles.icon} />
        <Text style={[styles.value, !label && styles.placeholder]} numberOfLines={1}>
          {label || placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={t('common.cancel')} />
        {draft && (
          <View style={styles.sheet}>
            <Text style={styles.title}>{placeholder}</Text>
            <View style={styles.headers}>
              <Text style={[styles.header, styles.colDay]}>{t('date.day')}</Text>
              <Text style={[styles.header, styles.colMonth]}>{t('date.month')}</Text>
              <Text style={[styles.header, styles.colYear]}>{t('date.year')}</Text>
            </View>
            <View style={styles.columns}>
              <Column
                style={styles.colDay}
                data={days}
                selected={draft.d}
                render={(d) => String(d)}
                onSelect={(d) => update({ d })}
              />
              <Column
                style={styles.colMonth}
                data={monthNumbers}
                selected={draft.m}
                render={(m) => months[m - 1]}
                onSelect={(m) => update({ m })}
              />
              <Column
                style={styles.colYear}
                data={years}
                selected={draft.y}
                render={showYear}
                onSelect={(y) => update({ y })}
              />
            </View>

            {isFuture ? <Text style={styles.warning}>{t('date.future')}</Text> : null}

            <View style={styles.actions}>
              {value ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Text style={styles.clearText}>{t('date.clear')}</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.flex} />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.okBtn, isFuture && styles.disabled]}
                onPress={confirm}
                disabled={isFuture}
              >
                <Text style={styles.okText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

// คอลัมน์หนึ่งของตัวเลือก — แตะเพื่อเลือก · เปิดมาเลื่อนให้ค่าที่เลือกอยู่ตรงกลาง
function Column({ data, selected, render, onSelect, style }) {
  const styles = useThemedStyles(makeStyles);
  const index = Math.max(0, data.indexOf(selected));
  const offset = Math.max(0, index - Math.floor(VISIBLE_ROWS / 2));
  return (
    <FlatList
      style={[styles.column, style]}
      data={data}
      keyExtractor={(item) => String(item)}
      initialScrollIndex={Math.min(offset, Math.max(0, data.length - VISIBLE_ROWS))}
      getItemLayout={(_, i) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * i, index: i })}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const active = item === selected;
        return (
          <TouchableOpacity
            style={[styles.row, active && styles.rowActive]}
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.rowText, active && styles.rowTextActive]} numberOfLines={1}>
              {render(item)}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    // หน้าตาเหมือน AuthInput (ช่องกรอกในหน้าสมัครสมาชิก)
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      height: 48,
      marginBottom: 12,
      shadowColor: c.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    icon: { marginRight: 10, width: 20, textAlign: 'center' },
    value: { flex: 1, color: c.text, fontSize: 14 },
    placeholder: { color: c.textMuted },
    backdrop: { flex: 1, backgroundColor: c.overlay },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 28,
    },
    title: { fontSize: 16, fontWeight: '700', color: c.text, textAlign: 'center', marginBottom: 12 },
    headers: { flexDirection: 'row', marginBottom: 6 },
    header: { fontSize: 12, color: c.textMuted, textAlign: 'center' },
    columns: { flexDirection: 'row', height: ROW_HEIGHT * VISIBLE_ROWS, gap: 8 },
    column: { borderRadius: 10, backgroundColor: c.surface },
    colDay: { flex: 2 },
    colMonth: { flex: 4 },
    colYear: { flex: 3 },
    row: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginHorizontal: 4 },
    rowActive: { backgroundColor: c.primary },
    rowText: { fontSize: 15, color: c.text },
    rowTextActive: { color: c.onPrimary, fontWeight: '700' },
    warning: { color: c.error, fontSize: 12, textAlign: 'center', marginTop: 10 },
    actions: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
    flex: { flex: 1 },
    clearBtn: { paddingVertical: 10, paddingHorizontal: 4 },
    clearText: { color: c.error, fontWeight: '600' },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
    cancelText: { color: c.textMuted, fontWeight: '600' },
    okBtn: { backgroundColor: c.primary, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 26 },
    okText: { color: c.onPrimary, fontWeight: '700' },
    disabled: { opacity: 0.4 },
  });
