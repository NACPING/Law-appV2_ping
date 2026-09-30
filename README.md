# Law App AI

แอปให้คำปรึกษากฎหมาย — Expo (React Native, JS) + Express/Prisma backend

## รันครั้งแรก

```bash
# 1) Backend
cd backend
npm install
copy .env.example .env      # แล้วแก้ JWT_SECRET เป็นค่าสุ่มยาวๆ
npx prisma migrate dev
npm run db:seed             # บัญชีทดสอบ + โพสต์ตัวอย่าง
npm run dev                 # API: http://localhost:5000/api

# 2) App (เปิด terminal ใหม่ ที่โฟลเดอร์ Law-appAI_APP)
npm install
npx expo start              # สแกน QR ด้วย Expo Go
```

มือถือกับคอมต้องอยู่ Wi-Fi เดียวกัน แอปจะหา IP ของ backend เองอัตโนมัติ
ถ้าใช้ `--tunnel` หรือ backend อยู่เครื่องอื่น ให้ตั้ง `EXPO_PUBLIC_API_URL` ใน `.env` (ดู `.env.example`)

## API

| Method | Path | หมายเหตุ |
|---|---|---|
| GET | `/api/health` | |
| POST | `/api/auth/register` | `role`: `client` / `lawyer` |
| POST | `/api/auth/login` | คืน `{ token, user }` |
| GET | `/api/auth/me` | ต้องมี `Authorization: Bearer <token>` |
| GET | `/api/posts` | รายการโพสต์ (โพสต์ไม่ระบุตัวตนจะไม่ส่งข้อมูลผู้เขียน) |
| POST | `/api/posts` | **เฉพาะ CLIENT** (ทนายได้ 403) · multipart: `title`, `content`, `isAnonymous`, `images` (ไม่บังคับ, สูงสุด 5 รูป, รูปละ ≤ 5 MB) |
| GET | `/api/posts/:id` | โพสต์ + คอมเมนต์ทั้งหมด |
| DELETE | `/api/posts/:id` | เฉพาะเจ้าของโพสต์หรือ ADMIN |
| POST | `/api/posts/:id/comments` | `{ content, parentId? }` — ใส่ `parentId` เพื่อตอบกลับ |
| DELETE | `/api/posts/:id/comments/:commentId` | เฉพาะเจ้าของคอมเมนต์หรือ ADMIN (ลบคำตอบใต้คอมเมนต์ด้วย) |

| GET | `/api/ebooks/categories` | หนังสือแยกตามหมวด (หน้า E-Book) |
| GET | `/api/ebooks?q=&category=` | ค้นหาจากชื่อ/คำอธิบาย |
| GET | `/api/ebooks/:id` | รายละเอียด + `fileUrl` + `isFavorite` |
| GET | `/api/ebooks/favorites` | หนังสือที่กดหัวใจไว้ |
| PUT / DELETE | `/api/ebooks/:id/favorite` | เพิ่ม/เอาออกจาก Favorite |

| POST | `/api/lawyer-requests` | **เฉพาะ CLIENT** · `{ subject, events, message? }` |
| GET | `/api/lawyer-requests?status=` | ลูกความ = ของตัวเอง, ทนาย = ที่ได้รับมอบหมาย, admin = ทั้งหมด |
| GET | `/api/lawyer-requests/:id` | เห็นได้ตามสิทธิ์เดียวกัน (ไม่มีสิทธิ์ = 404) |
| DELETE | `/api/lawyer-requests/:id` | ลูกความยกเลิกคำขอตัวเอง เฉพาะตอน PENDING |
| GET | `/api/lawyer-requests/lawyers` | **ADMIN** · รายชื่อทนาย + จำนวนเคสที่ดูแล |
| PATCH | `/api/lawyer-requests/:id/approve` | **ADMIN** · `{ lawyerId }` |
| PATCH | `/api/lawyer-requests/:id/reject` | **ADMIN** · `{ reason }` (ลูกความเห็นเหตุผล) |

| PATCH | `/api/lawyer-requests/:id/close` | **ทนายที่ดูแลเคส** · ส่งคำขอปิดเคส (ยังไม่ปิดจนกว่าลูกความยินยอม) |
| PATCH | `/api/lawyer-requests/:id/close/cancel` | **ทนายที่ดูแลเคส** · ยกเลิกคำขอปิดเคส |
| PATCH | `/api/lawyer-requests/:id/close/respond` | **ลูกความของเคส** · `{ accept }` ยินยอม = ปิดเคส (แชทอ่านอย่างเดียว) / ไม่ยินยอม = ดำเนินต่อ |
| GET | `/api/chats/:requestId/messages?before=` | ข้อความทีละ 40 (ใหม่ → เก่า) — เฉพาะลูกความและทนายของเคส |
| POST | `/api/chats/:requestId/messages` | multipart: `text?`, `file?` (รูปภาพ หรือ PDF ≤ 10 MB) |
| GET | `/api/chats/files/:messageId?token=` | เปิดไฟล์แนบ (ลิงก์มีอายุ 6 ชม. ได้จากรายการข้อความ) |

| GET | `/api/notifications` | การแจ้งเตือนของตัวเอง 50 รายการล่าสุด + `unreadCount` |
| GET | `/api/notifications/unread-count` | ตัวเลขบนกระดิ่ง |
| PATCH | `/api/notifications/:id/read` · `/api/notifications/read-all` | ทำเครื่องหมายว่าอ่านแล้ว |

| GET | `/api/users/:id` | หน้า Profile: ข้อมูล + `stats` + โพสต์ (ทนาย: ความคิดเห็นล่าสุด) · เบอร์/อีเมลเห็นเฉพาะเจ้าของ หรือทนายที่เปิด `showContact` · โพสต์ไม่ระบุตัวตนไม่แสดงให้คนอื่น |
| PATCH | `/api/users/me` | `{ firstName?, lastName?, phone?, bio? }` + ทนาย: `about?`, `showContact?` |
| PUT / DELETE | `/api/users/me/avatar` | เปลี่ยนรูปโปรไฟล์ (multipart `avatar` ≤ 5 MB) / ลบรูป — ไฟล์เก่าถูกลบให้ |
| PUT | `/api/users/me/password` | `{ currentPassword, newPassword }` |

ทุก API ของ `/api/posts`, `/api/ebooks`, `/api/lawyer-requests`, `/api/chats`, `/api/notifications`, `/api/users` ต้องล็อกอิน

**ภาษา:** ส่ง header `Accept-Language: th` หรือ `en` (ค่าเริ่มต้นไทย) — ข้อความ `message` ใน response จะเป็นภาษานั้น · การแจ้งเตือนส่ง `type` + `params` และข้อความระบบในแชทส่ง `systemCode` ให้แอปแปลเอง (รายการเก่าที่ไม่มีค่าเหล่านี้ใช้ `title`/`body`/`text` ภาษาไทยเดิม)

## การแจ้งเตือน (กระดิ่ง)

- แจ้งเมื่อ: มีคนคอมเมนต์โพสต์/ตอบกลับคอมเมนต์ของเรา · คำขอปรึกษาใหม่ (ถึง admin) · อนุมัติ/ปฏิเสธ (ถึงลูกความ) · ได้รับมอบหมายเคส (ถึงทนาย) · ข้อความแชทใหม่ · ขั้นตอนปิดเคส
- เรื่องเดียวกันที่ยังไม่อ่านรวมเป็นรายการเดียว เช่น "ได้รับข้อความใหม่ (3)", "Comment ใหม่ (2)"
- เปิดดูเรื่องนั้น (โพสต์ / ห้องแชท / คำขอ) = อ่านแล้วอัตโนมัติ · ไม่แจ้งข้อความแชทถ้าผู้รับเปิดห้องนั้นอยู่
- socket.io event: `notification:new`, `notification:count` (ส่งถึงห้องส่วนตัว `user:<id>` อัตโนมัติเมื่อเชื่อมต่อ)

## แชท (socket.io)

- เชื่อมต่อที่ `http://<host>:5000` ด้วย `auth: { token }` แล้ว `emit('chat:join', { requestId })`
- event: `message:new` (ข้อความใหม่ รวมข้อความระบบ `system: true`), `chat:status` (สถานะเคส/คำขอปิดเคสเปลี่ยน)
- แชทเห็นเฉพาะลูกความและทนายของเคส — **admin ไม่เห็นเนื้อหาแชท** (ทั้ง REST และ socket)
- ไฟล์แนบเก็บที่ `backend/storage/chat/` (ไม่อยู่ใน git, ไม่เปิดสาธารณะ) · ไฟล์ PDF อยู่ที่ `/files/ebooks/<slug>.pdf`

## E-Book

- ตัวบทกฎหมายไทยจริง 9 เล่ม (3 หมวด) จากเว็บไซต์หน่วยงานรัฐ — ตัวบทกฎหมายไม่มีลิขสิทธิ์ตาม พ.ร.บ.ลิขสิทธิ์ ม.7
- `npm run db:seed` ดาวน์โหลด PDF มาไว้ที่ `backend/storage/ebooks/` ให้เองถ้ายังไม่มี (ไฟล์ไม่อยู่ใน git) — รายการและแหล่งที่มาอยู่ใน `backend/prisma/seedEbooks.js`
- บางเล่มไม่ใช่ฉบับล่าสุด แอประบุ "ฉบับปรับปรุงถึง..." ไว้ในหน้ารายละเอียด
- ตัวอ่าน PDF ใช้ pdf.js (โหลดจาก cdnjs) ใน WebView — ต้องมีอินเทอร์เน็ต · รูปที่อัปโหลดเก็บใน `backend/uploads/` และเปิดดูได้ที่ `/uploads/<ชื่อไฟล์สุ่ม>`

## บัญชีทดสอบ (จาก `npm run db:seed`, รหัสผ่าน `password123`)

| Email | Role |
|---|---|
| somchai.lawyer@example.com | LAWYER |
| wipawadee.lawyer@example.com | LAWYER |
| nattapol@example.com | CLIENT |
| kittiporn@example.com | CLIENT |
| pimchanok@example.com | CLIENT |
| admin@example.com | ADMIN (สมัครผ่านแอปไม่ได้ มีจาก seed เท่านั้น) |

เนื้อหาโพสต์ตัวอย่างเขียนจากข้อมูลกฎหมายไทยที่ค้นคว้า ใช้เพื่อทดสอบเท่านั้น ไม่ใช่คำปรึกษาทางกฎหมาย
รูปภาพจาก [Unsplash](https://unsplash.com/license) (ใช้ฟรี)

ดูข้อมูลในฐานข้อมูล: `cd backend && npm run db:studio`
