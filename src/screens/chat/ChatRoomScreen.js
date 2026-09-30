import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardAware from '../../components/KeyboardAware';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import CloseCaseBanner from '../../components/chat/CloseCaseBanner';
import CloseCaseDialog from '../../components/chat/CloseCaseDialog';
import EmojiPanel from '../../components/chat/EmojiPanel';
import SystemMessage from '../../components/chat/SystemMessage';
import MessageBubble, { formatSize } from '../../components/chat/MessageBubble';
import ImageViewer from '../../components/community/ImageViewer';
import { useAuth } from '../../context/AuthContext';
import * as chatService from '../../services/chatService';
import * as requestService from '../../services/lawyerRequestService';
import { getSocket } from '../../services/socket';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { confirmAction, displayName } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

const MAX_FILE_MB = 10;

// รวมข้อความใหม่เข้ารายการ (เรียงใหม่ → เก่า) โดยไม่ซ้ำ — ข้อความเดียวกันอาจมาทั้งจากการส่งเองและจาก socket
function mergeMessages(current, incoming) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Use Case: Chat — แชท real-time ระหว่างลูกความกับทนายของเคส
export default function ChatRoomScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { requestId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null); // { kind, uri, name, size, mimeType, file? }
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const selectionRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const loadingOlderRef = useRef(false);

  const [caseBusy, setCaseBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dismissedCloseRequestRef = useRef(null); // คำขอปิดเคสที่ลูกความกด "ไว้ทีหลัง" แล้ว (ไม่เด้งซ้ำ)

  const isLawyer = user?.role === 'LAWYER';
  const isClient = user?.role === 'CLIENT';
  const closed = chat?.status === 'CLOSED';
  const closePending = chat?.status === 'APPROVED' && !!chat?.closeRequestedAt;

  // ลูกความ: เมื่อมีคำขอปิดเคสใหม่ (ตอนเปิดห้อง หรือทนายเพิ่งกดขณะเปิดห้องอยู่) ให้หน้าต่างเด้งขึ้น
  useEffect(() => {
    if (isClient && closePending && dismissedCloseRequestRef.current !== chat.closeRequestedAt) {
      setDialogOpen(true);
    }
    if (!closePending) setDialogOpen(false);
  }, [isClient, closePending, chat?.closeRequestedAt]);

  const loadLatest = useCallback(async () => {
    try {
      const d = await chatService.getMessages(requestId);
      setChat(d.chat);
      setMessages((prev) => mergeMessages(prev, d.messages));
      setHasMore(d.hasMore);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [requestId]);

  // โหลดข้อความ + เชื่อม socket: เข้าห้อง, รับข้อความใหม่, รับแจ้งปิดเคส (เชื่อมใหม่เมื่อหลุด แล้วโหลดส่วนที่พลาดไป)
  useEffect(() => {
    let socket;
    let active = true;
    // เข้าห้องเสร็จแล้วโหลดสถานะล่าสุดอีกครั้ง — กันพลาดเหตุการณ์ที่เกิดระหว่างโหลดหน้ากับตอนเข้าห้อง
    const join = () => socket.emit('chat:join', { requestId }, () => active && loadLatest());
    const onMessage = (m) => m.requestId === requestId && setMessages((prev) => mergeMessages(prev, [m]));
    // สถานะเคสเปลี่ยน (ทนายขอปิด/ยกเลิก, ลูกความยินยอม/ไม่ยินยอม)
    const onStatus = (e) =>
      e.requestId === requestId &&
      setChat((c) => c && { ...c, status: e.status, closeRequestedAt: e.closeRequestedAt, closedAt: e.closedAt });
    const onReconnect = () => join();

    loadLatest();
    getSocket().then((s) => {
      if (!active) return;
      socket = s;
      if (socket.connected) join();
      socket.on('connect', onReconnect);
      socket.on('message:new', onMessage);
      socket.on('chat:status', onStatus);
    });

    return () => {
      active = false;
      if (!socket) return;
      socket.emit('chat:leave', { requestId });
      socket.off('connect', onReconnect);
      socket.off('message:new', onMessage);
      socket.off('chat:status', onStatus);
    };
  }, [requestId, loadLatest]);

  // เรียก API เปลี่ยนสถานะเคส แล้วอัปเดตหน้าจอ (อีกฝ่ายได้รับผ่าน socket "chat:status")
  const runCaseAction = useCallback(
    async (action) => {
      setCaseBusy(true);
      setError('');
      try {
        const { request } = await action();
        setChat((c) => ({ ...c, status: request.status, closeRequestedAt: request.closeRequestedAt, closedAt: request.closedAt }));
      } catch (e) {
        setError(e.message);
        loadLatest(); // สถานะอาจเปลี่ยนไปแล้ว (เช่น ทนายยกเลิกคำขอก่อน)
      } finally {
        setCaseBusy(false);
      }
    },
    [loadLatest]
  );

  // ทนาย: ส่งคำขอปิดเคส (ยังไม่ปิดจนกว่าลูกความยินยอม)
  const handleRequestClose = useCallback(async () => {
    const ok = await confirmAction(
      t('chat.requestCloseTitle'),
      t('chat.requestCloseBody'),
      t('chat.sendRequest')
    );
    if (ok) runCaseAction(() => requestService.requestCloseCase(requestId));
  }, [requestId, runCaseAction]);

  const handleCancelClose = () => runCaseAction(() => requestService.cancelCloseCase(requestId));

  // ลูกความ: ตอบคำขอปิดเคส
  const respondClose = (accept) => {
    setDialogOpen(false);
    runCaseAction(() => requestService.respondCloseCase(requestId, accept));
  };
  const handleAcceptFromBanner = async () => {
    const ok = await confirmAction(t('chat.acceptCloseTitle'), t('chat.acceptCloseBody'), t('chat.accept'));
    if (ok) respondClose(true);
  };

  useLayoutEffect(() => {
    const other = isLawyer ? chat?.client : chat?.lawyer;
    navigation.setOptions({
      title: other ? displayName(other) : route.params.name ?? t('nav.chat'),
      headerRight:
        isLawyer && chat?.status === 'APPROVED' && !chat?.closeRequestedAt
          ? () => (
              <TouchableOpacity onPress={handleRequestClose} hitSlop={8} accessibilityLabel={t('chat.closeCase')}>
                <Text style={styles.closeCase}>{t('chat.closeCase')}</Text>
              </TouchableOpacity>
            )
          : undefined,
    });
  }, [navigation, chat, isLawyer, handleRequestClose, route.params.name, styles]);

  const loadOlder = async () => {
    if (!hasMore || loadingOlderRef.current || messages.length === 0) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const d = await chatService.getMessages(requestId, messages[messages.length - 1].createdAt);
      setMessages((prev) => mergeMessages(prev, d.messages));
      setHasMore(d.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  };

  const tooBig = (size) => size && size > MAX_FILE_MB * 1024 * 1024;

  const pickImage = async () => {
    setMenuOpen(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled) return;
      const a = result.assets[0];
      if (tooBig(a.fileSize ?? a.file?.size)) return setError(t('errors.fileTooBig', { mb: MAX_FILE_MB }));
      setAttachment({ ...a, kind: 'image', name: a.fileName ?? 'image.jpg', size: a.fileSize ?? a.file?.size });
      setError('');
    } catch (e) {
      setError(t('chat.pickImageFailed', { message: e.message }));
    }
  };

  const pickPdf = async () => {
    setMenuOpen(false);
    try {
      // Android: ไม่ให้ picker คัดลอกไฟล์ไปไว้ใน cache ของแอป Expo Go (expo-file-system จะไม่มีสิทธิ์อ่าน
      // "Missing 'READ' permission") — ใช้ content:// ของไฟล์ต้นฉบับแทน ซึ่งอ่านได้ด้วยสิทธิ์ที่ picker ให้มา
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: Platform.OS !== 'android',
      });
      if (result.canceled) return;
      const a = result.assets[0];
      if (tooBig(a.size)) return setError(t('errors.fileTooBig', { mb: MAX_FILE_MB }));
      const name = a.name && /\.pdf$/i.test(a.name) ? a.name : `${a.name || 'document'}.pdf`;
      setAttachment({ ...a, kind: 'pdf', name, mimeType: 'application/pdf' });
      setError('');
    } catch (e) {
      setError(t('chat.pickFileFailed', { message: e.message }));
    }
  };

  // แทรก emoji ตรงตำแหน่งเคอร์เซอร์ — ใช้ตำแหน่งเดิมเฉพาะเมื่อข้อความยังไม่เปลี่ยนตั้งแต่บันทึกตำแหน่ง
  // ไม่อย่างนั้นต่อท้ายข้อความ (กันแทรกกลางคำเมื่อตำแหน่งเคอร์เซอร์เก่าไปแล้ว)
  const insertEmoji = (emoji) => {
    const sel = selectionRef.current;
    const fresh = sel && sel.textLength === text.length && sel.end <= text.length;
    const start = fresh ? sel.start : text.length;
    const end = fresh ? sel.end : text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    if (next.length > 2000) return;
    setText(next);
    const pos = start + emoji.length;
    selectionRef.current = { start: pos, end: pos, textLength: next.length };
  };

  const toggleEmoji = () => {
    setMenuOpen(false);
    setEmojiOpen((open) => {
      if (!open) Keyboard.dismiss(); // เปิดแผง emoji แทนคีย์บอร์ด
      return !open;
    });
  };

  const handleSend = async () => {
    const body = text.trim();
    if ((!body && !attachment) || sending) return;
    setSending(true);
    setError('');
    try {
      const { message } = await chatService.sendMessage(requestId, { text: body, file: attachment });
      setMessages((prev) => mergeMessages(prev, [message]));
      setText('');
      setAttachment(null);
      selectionRef.current = null;
    } catch (e) {
      setError(e.message);
      if (e.status === 409) loadLatest(); // เคสถูกปิดระหว่างพิมพ์
    } finally {
      setSending(false);
    }
  };

  const openPdf = (file) => navigation.navigate('ChatFile', { url: file.url, name: file.name });

  if (!chat) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  return (
    <KeyboardAware style={styles.container}>
      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item, index }) => {
          if (item.system) return <SystemMessage message={item} />;
          // รายการกลับหัว: ข้อความก่อนหน้าในเวลาคือ index + 1
          const prev = messages[index + 1];
          return (
            <MessageBubble
              message={item}
              isMine={item.sender.id === user.id}
              showHeader={!prev || prev.system || prev.sender.id !== item.sender.id}
              onOpenImage={setViewerImage}
              onOpenPdf={openPdf}
            />
          );
        }}
        contentContainerStyle={styles.list}
        onEndReached={loadOlder}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          <View style={styles.listTop}>
            {loadingOlder && <ActivityIndicator color={colors.accent} />}
            {!hasMore && (
              <Text style={styles.caseInfo}>
                {t('chat.intro', {
                  subject: chat.subject,
                  other: isLawyer ? t('chat.introOtherClient') : t('chat.introOtherLawyer'),
                })}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('chat.emptyRoom')}</Text>}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {closePending && (isClient || isLawyer) && (
        <CloseCaseBanner
          isClient={isClient}
          busy={caseBusy}
          onAccept={handleAcceptFromBanner}
          onDecline={() => respondClose(false)}
          onCancel={handleCancelClose}
        />
      )}

      {closed ? (
        <View style={[styles.closedBar, { paddingBottom: 12 + insets.bottom }]}>
          <Ionicons name="lock-closed" size={16} color={colors.icon} />
          <Text style={styles.closedText}>{t('chat.closedBar')}</Text>
        </View>
      ) : (
        <View style={styles.composer}>
          {attachment && (
            <View style={styles.attachment}>
              {attachment.kind === 'image' ? (
                <Image source={{ uri: attachment.uri }} style={styles.attachThumb} />
              ) : (
                <Ionicons name="document-text" size={28} color="#D32F2F" />
              )}
              <Text style={styles.attachName} numberOfLines={1}>
                {attachment.name}
                {attachment.size ? ` · ${formatSize(attachment.size)}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setAttachment(null)} hitSlop={8} accessibilityLabel={t('chat.removeAttachment')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* เมนูแนบไฟล์อยู่ในกล่องนี้ (ไม่ลอยออกนอกกรอบ) — Android กดปุ่มที่อยู่นอกกรอบของ parent ไม่ได้ */}
          {menuOpen && (
            <View style={styles.menu}>
              <TouchableOpacity style={styles.menuItem} onPress={pickImage} accessibilityRole="button">
                <Ionicons name="image-outline" size={20} color={colors.accent} />
                <Text style={styles.menuText}>{t('chat.sendImage')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={pickPdf} accessibilityRole="button">
                <Ionicons name="document-attach-outline" size={20} color={colors.accent} />
                <Text style={styles.menuText}>{t('chat.sendPdf')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputRow, { paddingBottom: emojiOpen ? 8 : 8 + insets.bottom }]}>
            <TouchableOpacity
              onPress={() => {
                setEmojiOpen(false);
                setMenuOpen((o) => !o);
              }}
              hitSlop={8}
              accessibilityLabel={t('chat.attach')}
              disabled={!!attachment}
            >
              <Ionicons name={menuOpen ? 'close' : 'add'} size={26} color={attachment ? colors.textFaint : colors.text} />
            </TouchableOpacity>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={colors.textMuted}
                value={text}
                onChangeText={setText}
                onSelectionChange={(e) => {
                  selectionRef.current = { ...e.nativeEvent.selection, textLength: text.length };
                }}
                onFocus={() => {
                  setEmojiOpen(false);
                  setMenuOpen(false);
                }}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity onPress={toggleEmoji} hitSlop={8} accessibilityLabel={emojiOpen ? t('chat.emojiClose') : t('chat.emojiOpen')}>
                <Ionicons name={emojiOpen ? 'happy' : 'happy-outline'} size={24} color={emojiOpen ? colors.accent : colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || (!text.trim() && !attachment)}
              hitSlop={8}
              accessibilityLabel={t('chat.send')}
            >
              {sending ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Ionicons name="send" size={22} color={text.trim() || attachment ? colors.accent : colors.textFaint} />
              )}
            </TouchableOpacity>
          </View>

          {emojiOpen && <EmojiPanel onSelect={insertEmoji} style={{ paddingBottom: insets.bottom }} />}
        </View>
      )}

      <CloseCaseDialog
        visible={dialogOpen}
        lawyerName={displayName(chat.lawyer)}
        onAccept={() => respondClose(true)}
        onDecline={() => respondClose(false)}
        onLater={() => {
          dismissedCloseRequestRef.current = chat.closeRequestedAt;
          setDialogOpen(false);
        }}
      />

      <ImageViewer
        images={viewerImage ? [viewerImage] : []}
        startIndex={viewerImage ? 0 : null}
        onClose={() => setViewerImage(null)}
      />
    </KeyboardAware>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: 24 },
    list: { paddingVertical: 12 },
    listTop: { alignItems: 'center', paddingVertical: 12 },
    caseInfo: { fontSize: 11, color: c.textMuted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 17 },
    empty: { textAlign: 'center', color: c.textMuted, marginVertical: 24, transform: [{ scaleY: -1 }] },
    error: { color: c.error, textAlign: 'center', paddingHorizontal: 16, paddingVertical: 6 },
    closeCase: { color: c.error, fontWeight: '700', fontSize: 14 },
    closedBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingTop: 12,
      backgroundColor: c.surface,
    },
    closedText: { color: c.icon, fontSize: 13 },
    composer: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface },
    attachment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 12,
      marginTop: 8,
      padding: 8,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    attachThumb: { width: 40, height: 40, borderRadius: 6 },
    attachName: { flex: 1, fontSize: 12, color: c.text },
    menu: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 10 },
    menuItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    menuText: { fontSize: 14, color: c.accent, fontWeight: '600' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 8 },
    inputBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 40,
      backgroundColor: c.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      paddingLeft: 14,
      paddingRight: 8,
    },
    input: { flex: 1, maxHeight: 110, paddingVertical: 8, fontSize: 14, color: c.text },
  });
