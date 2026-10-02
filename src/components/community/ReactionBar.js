import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import * as postService from '../../services/postService';
import { REACTIONS } from '../../utils/reactions';

const PICKER_WIDTH = REACTIONS.length * 48 + 12;

// แถบล่างของการ์ดโพสต์ (แบบเฟซบุ๊ก)
// แตะปุ่ม = ถูกใจ / ยกเลิก · กดค้าง = เปิดแถบเลือกความรู้สึก · แตะสรุปด้านขวา = ดูรายชื่อคนที่กด
// เก็บ state เองแล้วอัปเดตทันที (ไม่รอ server) — ถ้าส่งไม่สำเร็จค่อยคืนค่าเดิม
export default function ReactionBar({ post }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const buttonRef = useRef(null);
  const [state, setState] = useState(() => pick(post));
  const [picker, setPicker] = useState(null); // { x, y } ตำแหน่งแถบเลือก
  const busy = useRef(false);

  // หน้าแม่โหลดข้อมูลใหม่ (เช่น กลับมาที่ feed) → ใช้ค่าจาก server
  // ดูเฉพาะค่ารีแอคชัน — หน้าแม่แก้ฟิลด์อื่น (เช่น จำนวนคอมเมนต์) ต้องไม่ทับค่าที่เพิ่งกด
  const serverKey = `${post.id}|${post.myReaction}|${JSON.stringify(post.reactions)}`;
  useEffect(() => {
    setState(pick(post));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const send = async (type) => {
    if (busy.current) return;
    busy.current = true;
    const before = state;
    setState(applyLocal(state, type));
    try {
      setState(await (type ? postService.react(post.id, type) : postService.unreact(post.id)));
    } catch {
      setState(before);
    } finally {
      busy.current = false;
    }
  };

  const openPicker = () => {
    // วัดตำแหน่งปุ่มบนจอ แล้ววางแถบเลือกไว้เหนือปุ่ม (ใน Modal จึงกดได้แม้ล้นขอบการ์ด)
    buttonRef.current?.measureInWindow((x, y) => {
      setPicker({ x: Math.max(8, Math.min(x, screenWidth - PICKER_WIDTH - 8)), y: Math.max(8, y - 60) });
    });
  };

  const choose = (type) => {
    setPicker(null);
    send(type === state.myReaction ? null : type);
  };

  const mine = REACTIONS.find((r) => r.type === state.myReaction);
  // ไอคอนสรุป: แบบที่มีคนกดมากที่สุดก่อน สูงสุด 3 แบบ
  const top = REACTIONS.filter((r) => state.reactions[r.type] > 0)
    .sort((a, b) => state.reactions[b.type] - state.reactions[a.type])
    .slice(0, 3);

  if (!post.canReact && state.reactionCount === 0) return null;

  return (
    <View style={styles.bar}>
      {post.canReact ? (
        <TouchableOpacity
          ref={buttonRef}
          style={styles.button}
          onPress={() => send(state.myReaction ? null : 'LIKE')}
          onLongPress={openPicker}
          delayLongPress={300}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={mine ? t(`reaction.${mine.type}`) : t('reaction.LIKE')}
          accessibilityState={{ selected: Boolean(mine) }}
          accessibilityHint={t('reaction.hint')}
        >
          <Text style={[styles.buttonEmoji, !mine && styles.unselectedEmoji]}>{mine ? mine.emoji : '👍'}</Text>
          <Text style={[styles.buttonText, mine && styles.buttonTextActive]}>
            {t(`reaction.${mine ? mine.type : 'LIKE'}`)}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}

      {state.reactionCount > 0 && (
        <TouchableOpacity
          style={styles.summary}
          onPress={() => navigation.push('PostReactions', { postId: post.id })}
          hitSlop={6}
          accessibilityLabel={t('reaction.viewPeople', { n: state.reactionCount })}
        >
          {top.map((r, i) => (
            <Text key={r.type} style={[styles.summaryEmoji, i > 0 && styles.overlap]}>
              {r.emoji}
            </Text>
          ))}
          <Text style={styles.summaryCount}>{state.reactionCount}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={Boolean(picker)} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setPicker(null)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setPicker(null)} accessibilityLabel={t('common.cancel')}>
          {picker && (
            <View style={[styles.picker, { left: picker.x, top: picker.y }]}>
              {REACTIONS.map((r) => (
                <TouchableOpacity
                  key={r.type}
                  style={[styles.pickerItem, r.type === state.myReaction && styles.pickerItemActive]}
                  onPress={() => choose(r.type)}
                  accessibilityLabel={t(`reaction.${r.type}`)}
                >
                  <Text style={styles.pickerEmoji}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const pick = (p) => ({ reactions: p.reactions ?? {}, reactionCount: p.reactionCount ?? 0, myReaction: p.myReaction ?? null });

// คำนวณผลล่วงหน้าในเครื่อง (type = null คือยกเลิก)
function applyLocal(s, type) {
  const reactions = { ...s.reactions };
  let count = s.reactionCount;
  if (s.myReaction) {
    reactions[s.myReaction] = Math.max(0, (reactions[s.myReaction] ?? 0) - 1);
    count -= 1;
  }
  if (type) {
    reactions[type] = (reactions[type] ?? 0) + 1;
    count += 1;
  }
  return { reactions, reactionCount: count, myReaction: type };
}

const makeStyles = (c) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingRight: 8 },
    buttonEmoji: { fontSize: 16 },
    // ยังไม่กด: ไอคอนจางลงให้ต่างจากตอนกดแล้ว
    unselectedEmoji: { opacity: 0.45 },
    buttonText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: c.textMuted },
    buttonTextActive: { color: c.accent },
    summary: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingLeft: 8 },
    summaryEmoji: { fontSize: 14 },
    overlap: { marginLeft: -3 },
    summaryCount: { marginLeft: 5, fontSize: 12, color: c.textMuted },
    picker: {
      position: 'absolute',
      flexDirection: 'row',
      padding: 6,
      borderRadius: 28,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 8,
    },
    pickerItem: { width: 44, height: 44, marginHorizontal: 2, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    pickerItemActive: { backgroundColor: c.primaryLight },
    pickerEmoji: { fontSize: 28 },
  });
