# Law App AI — คู่มือสำหรับ Claude / ผู้พัฒนา

แอปปรึกษากฎหมาย (มือถือ) สำหรับลูกความ ทนาย และผู้ดูแลระบบ
เจ้าของโปรเจกต์คุยภาษาไทย — ตอบเป็นภาษาไทย ใช้คำอธิบายที่เข้าใจง่าย

> โฟลเดอร์ `../Law-app` เป็น **ตัวอย่างอ้างอิงเท่านั้น** ห้ามแก้ งานทั้งหมดอยู่ในโฟลเดอร์นี้ (`Law-appAI_APP`)

## เอกสารที่ต้องอ่านก่อนเริ่มงาน

- `README.md` — วิธีรัน, รายการ API ทั้งหมด, บัญชีทดสอบ
- `docs/use-cases.md` — Use Case + Description (UC-01 ถึง UC-07) และกฎของแต่ละฟีเจอร์
- `docs/figma/` — รูปหน้าจอจาก Figma (ทำ UI ให้ตรงแบบนี้, โทนสีหลัก `#1E2B58`)

## Stack

- **App:** Expo SDK 57, React Native 0.86, JavaScript (ไม่ใช้ TypeScript), React Navigation 7
- **Backend:** `backend/` — Express 5 + Prisma 5 (SQLite `backend/prisma/dev.db`) + JWT + socket.io
- Expo เปลี่ยนเร็ว — ก่อนใช้ API ของ Expo ให้เช็กเอกสาร https://docs.expo.dev/versions/v57.0.0/ หรือไฟล์ `.d.ts` ใน `node_modules`

## โครงสร้าง

```
src/
  navigation/   RootNavigator (สลับ Auth ↔ App ตามการล็อกอิน)
                AppNavigator = Stack(Tabs, Notifications, Settings + หน้าย่อย) · Tabs: Community / E-Book / Chat / Profile
                หน้าแรกทุกแท็บ: ☰ ซ้ายบน (MenuButton → Settings) · ขวาบน: ปุ่มเฉพาะหน้า (ค้นหา/หัวใจ) + กระดิ่ง
                แต่ละแท็บมี Stack ของตัวเอง (CommunityNavigator, EbookNavigator, ChatNavigator, ProfileNavigator)
  screens/      auth, community, ebook, chat (คำขอปรึกษา + แชท + หน้า admin), notifications,
                profile (UserProfileScreen ใช้ทั้งโปรไฟล์ตัวเองและคนอื่น, Settings, EditProfile, ChangePassword, Help,
                Language, AccountSwitchesScreen = Notifications/Posting, ReadingSettings)
  components/   ใช้ซ้ำ — KeyboardAware, BellButton, chat/*, community/*, consult/*, ebook/*
  context/      AuthContext (user, token), NotificationContext (ตัวเลขบนกระดิ่ง, real-time),
                ThemeContext (Dark mode: useTheme, useThemedStyles), LanguageContext (useLanguage → t)
  theme/        colors (lightColors/darkColors), typography (ฟอนต์ชื่อหน้า)
  i18n/         th.js / en.js (ข้อความทุกจุด key ตรงกัน), index.js (translate, localeOf)
  utils/labels  แปลงข้อมูลจาก backend เป็นข้อความตามภาษา (แจ้งเตือน, ข้อความระบบแชท, ชื่อหมวดหนังสือ)
  services/     เรียก API ทั้งหมดผ่าน apiClient.request() · socket.js = socket.io ตัวเดียวทั้งแอป
  utils/        formFile (แนบไฟล์ใน FormData), downloadPdf, format (timeAgo, confirmAction)
backend/src/
  controllers/  auth, post, ebook, lawyerRequest (รวมปิดเคส), chat, notification, user (โปรไฟล์), follow (ผู้ติดตาม)
  services/notify.js   สร้าง/รวม/ส่งการแจ้งเตือน (เก็บ type + params ไม่เก็บประโยค)
  i18n.js              ข้อความ error ไทย/อังกฤษ — req.t(key) ตาม header Accept-Language
  realtime.js          socket.io: ห้อง request:<id> (แชท), user:<id> (แจ้งเตือน)
backend/prisma/ schema.prisma, seed.js (+ seedEbooks.js, seedLawyerRequests.js)
```

## กฎของระบบที่ตกลงกับเจ้าของแล้ว (ห้ามเปลี่ยนโดยไม่ถามก่อน)

- **บทบาท:** CLIENT / LAWYER เลือกตอนสมัคร · ADMIN สร้างจาก seed เท่านั้น (`admin@example.com`)
- **Login:** ใช้ Email + Password
- **โพสต์:** เฉพาะ CLIENT สร้างโพสต์ได้ — **ทนายคอมเมนต์ได้อย่างเดียว** · โพสต์ไม่ระบุตัวตน = backend ไม่ส่งข้อมูลผู้เขียนเลย
- **E-Book:** ทุก role อ่าน/ค้นหา/Favorite/ดาวน์โหลดได้ · เนื้อหาเป็นตัวบทกฎหมายจริงจากเว็บหน่วยงานรัฐ · ปกหนังสือแอปวาดเอง (ห้ามใช้ปกหนังสือที่มีลิขสิทธิ์)
- **คำขอปรึกษา:** ลูกความส่ง → **admin อนุมัติในแอปพร้อมเลือกทนาย** หรือปฏิเสธพร้อมเหตุผล
- **แชท:** เห็นเฉพาะลูกความและทนายของเคส — **admin อ่านแชทไม่ได้** · ส่งข้อความ รูป PDF emoji ได้ · ไฟล์แนบเก็บแบบไม่สาธารณะ (ลิงก์มีอายุ)
- **ปิดเคส: ต้องยินยอมทั้งสองฝ่าย** — ทนาย**หรือลูกความ**ขอปิด → อีกฝ่ายยินยอม (ปิด, แชทอ่านอย่างเดียว) / ไม่ยินยอม (ดำเนินต่อ) · คนขอยกเลิกคำขอของตัวเองได้ · ค้างได้ทีละ 1 คำขอ (`closeRequestedBy` = LAWYER | CLIENT)
- **Profile:** ดูโปรไฟล์คนอื่นได้ (แตะชื่อใน Community) · เบอร์/อีเมลเห็นเฉพาะเจ้าของ ยกเว้นทนายเปิด `showContact` · โพสต์ไม่ระบุตัวตนไม่โผล่ในโปรไฟล์ที่คนอื่นเห็น · ไม่มีปุ่ม Message (แชทต้องผ่านคำขอปรึกษา)
- **ผู้ติดตาม:** ติดตามแบบทางเดียว (ไม่ต้องตอบรับ) · ลูกความ/ทนายติดตามกันได้ทุกคน, admin ไม่ติดตามและไม่ถูกติดตาม · รายชื่อผู้ติดตามทุกคนดูได้ · แท็บ "ติดตาม" ในชุมชน = โพสต์ของคนที่ติดตาม + โพสต์ที่คนที่ติดตามไปคอมเมนต์ · แจ้งเตือนเมื่อมีผู้ติดตามใหม่ (รวมรายการ) และเมื่อคนที่ติดตามโพสต์ใหม่ (**ไม่รวมโพสต์ไม่ระบุตัวตน**)
- **แจ้งเตือน:** ในแอปเท่านั้น (ไม่มี push) · รวมเรื่องเดียวกันเป็นรายการเดียว · เปิดดูแล้ว = อ่านแล้ว
- **ไม่ทำ** หน้า admin สำหรับลบโพสต์/จัดการหนังสือในแอป — admin ใช้ Prisma Studio
- ฟีเจอร์ที่มีเรื่อง "ใครทำอะไรได้" → **ถามเจ้าของก่อนเริ่มทำเสมอ**

## วิธีทำงานในโปรเจกต์นี้

- คำสั่งอยู่ที่ `C:\Program Files\nodejs` — ถ้า shell หา `node`/`npm` ไม่เจอ ให้เติม path นี้ก่อน
- ตรวจว่า build ผ่าน: `npx expo export --platform android` และ `--platform web` (ใส่ `--output-dir` ไปที่ temp)
- **เจ้าของมักเปิด `npm run dev` ค้างไว้ที่ port 5000** — เช็กก่อนเปิด server ทดสอบ และปิดทุกตัวที่เปิดเองก่อนจบงาน
- หลังแก้ `schema.prisma`: `npx prisma migrate dev --name <ชื่อ>` — ถ้าติด **EPERM** แปลว่า backend เปิดอยู่ล็อกไฟล์ ต้องหยุดก่อนแล้ว `npx prisma generate`
- ทดสอบด้วยบัญชีจาก seed (รหัส `password123`) และ **ลบข้อมูลทดสอบที่สร้างเองทุกครั้ง** — ข้อมูลอื่นในฐานข้อมูลเป็นของเจ้าของ ห้ามลบ
- การทดสอบบนเว็บ **จับปัญหาเฉพาะมือถือไม่ได้** (ไฟล์, คีย์บอร์ด, การแตะ) → ให้เจ้าของลองใน Expo Go บนมือถือ Android ทุกครั้งที่เกี่ยวข้อง
- คอมเมนต์ในโค้ดเขียนภาษาไทย อธิบาย "ทำไม" ตามสไตล์ไฟล์เดิม

## ข้อควรระวัง (เคยเจอมาแล้ว)

- **Expo 57 ใช้ `expo/fetch`** บนมือถือ → FormData แบบ `{ uri, name, type }` **ใช้ไม่ได้** · ใช้ `utils/formFile.js` (อ่าน bytes ก่อนแนบ) และ expo/fetch ส่งชื่อไฟล์แบบ percent-encoded (backend แปลงกลับแล้ว)
- **Android edge-to-edge:** คีย์บอร์ดไม่ดันหน้าจอเอง → ใช้ `components/KeyboardAware` แทน KeyboardAvoidingView ทุกหน้า
- **ช่องพิมพ์หลายบรรทัด (multiline)** ต้องมี `maxHeight` และเลื่อน ScrollView ไปที่ช่องตอน `onFocus` (ดู EditProfileScreen/CreatePostScreen) — ไม่งั้นพิมพ์ยาวแล้วช่องขยายจนโดนคีย์บอร์ดบัง
- **Dark mode: ห้ามเขียนสีตรงๆ** — สไตล์เขียนเป็น `const makeStyles = (c) => StyleSheet.create({...})` แล้ว `useThemedStyles(makeStyles)` ใน component · สีใน JSX ใช้ `const { colors } = useTheme()` · ตัวอักษร/ไอคอนสีแบรนด์ใช้ `accent` (ไม่ใช่ `primary` ซึ่งมืดเกินบนพื้นมืด) · `navigation.setOptions` ใน useLayoutEffect ต้องใส่ `colors`/`styles` ใน deps ไม่งั้นปุ่มบน header ค้างสีเดิม
- **ภาษา (ไทย/อังกฤษ): ห้ามเขียนข้อความตรงๆ** — แอปใช้ `t('key')` + เพิ่ม key ทั้ง `i18n/th.js` และ `en.js` · backend ใช้ `req.t('key')` (`backend/src/i18n.js`) · การแจ้งเตือน/ข้อความระบบใหม่ เก็บเป็นรหัส + params แล้วเพิ่มคำแปลใน `notif.*` / `chat.system.*` · component ที่แสดงข้อความผ่าน utils (timeAgo, displayName) ต้องเรียก `useLanguage()` ไม่งั้นไม่ render ใหม่ตอนเปลี่ยนภาษา
- **Android:** ปุ่มที่อยู่นอกกรอบของ View แม่ (position absolute ล้นออกไป) **กดไม่ได้** · ใน header ส่วนที่ล้นจะ**ถูกตัดขอบ**ด้วย (เคยเกิดกับตัวเลขบนกระดิ่ง) → เผื่อ padding ให้อยู่ในกรอบ
- **Expo Go Android + expo-document-picker:** `copyToCacheDirectory: true` ทำให้อ่านไฟล์ไม่ได้ ("Missing 'READ' permission") → ใช้ `false` บน Android
- **WebView ของ Android แสดง PDF ไม่ได้** → ตัวอ่าน PDF ใช้ pdf.js (`components/ebook/pdfViewerHtml.js`) · บนเว็บใช้ iframe `allow-scripts allow-same-origin`
- React Navigation 7: ย้อนกลับไปหน้าที่มีอยู่แล้วใช้ `popTo` (`navigate` จะซ้อนหน้าใหม่)
- โฟลเดอร์โปรเจกต์อยู่ใต้ `.vscode` → `res.sendFile` ต้องใช้ `{ root }` (ไม่งั้นโดนปฏิเสธเพราะชื่อขึ้นต้นด้วยจุด)
- krisdika.go.th ใช้ certificate ที่เครื่องนี้ไม่เชื่อถือ และ ratchakitcha.soc.go.th มีระบบกันบอต — **ห้ามข้ามการตรวจสอบ**

## สถานะงาน

เสร็จแล้ว: Register/Login · Posting · Reading (E-Book) · Lawyer_request · Chat · Notification · Profile & Settings (UC-01–08)
Settings ครบทุกเมนูตาม Figma: Account, Privacy, Notifications (ปิดตามประเภท — เก็บที่บัญชี, backend ไม่สร้างแจ้งเตือนที่ปิดไว้), Posting (เฉพาะลูกความ: ไม่ระบุตัวตนเป็นค่าเริ่มต้น), Reading (จำหน้าที่อ่าน + หน้ากระดาษโทนมืด — เก็บในเครื่อง), Language, Dark mode, Help
ระบบผู้ติดตาม (Follow) เสร็จแล้ว
