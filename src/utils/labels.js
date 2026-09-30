import { translate } from '../i18n';

// แปลงข้อมูลจาก backend เป็นข้อความตามภาษาที่เลือก
// backend ส่ง "รหัส + ข้อมูลประกอบ" มาแทนประโยคสำเร็จรูป จึงเปลี่ยนภาษาได้แม้เป็นรายการเก่า
// ข้อมูลเก่าที่บันทึกก่อนมีระบบนี้ (ไม่มีรหัส) แสดงข้อความเดิมที่เก็บไว้

// ชื่อหมวดหนังสือ: ใช้คำแปลตาม id ของหมวด ถ้าไม่มีใช้ชื่อจากฐานข้อมูล
export function categoryName(category) {
  if (!category) return '';
  const key = `ebook.categories.${category.id}`;
  const label = translate(key);
  return label === key ? category.name : label;
}

// ข้อความระบบในแชท (เช่น ขั้นตอนปิดเคส)
export const systemMessageText = (message) =>
  message.systemCode ? translate(`chat.system.${message.systemCode}`) : message.text;

// ตัวอย่างข้อความล่าสุด (รายการแชท / การแจ้งเตือน): ข้อความระบบ → แปล, ไฟล์ → [รูปภาพ]/[ไฟล์ PDF]
export function messagePreview({ text, systemCode, fileKind }) {
  if (systemCode) return translate(`chat.system.${systemCode}`);
  if (text) return text;
  return translate(fileKind === 'pdf' ? 'chat.pdf' : 'chat.image');
}

// หัวข้อและเนื้อหาการแจ้งเตือน — สร้างจาก type + params (count > 1 ใช้หัวข้อแบบรวมหลายรายการถ้ามี)
export function notificationText(n) {
  if (!n.params) return { title: n.title, body: n.body };
  const params = { ...n.params, count: n.count };
  if (n.params.fileKind || n.params.systemCode) params.preview = messagePreview(n.params);
  const manyKey = `notif.title.${n.type}_MANY`;
  const titleKey = n.count > 1 && translate(manyKey) !== manyKey ? manyKey : `notif.title.${n.type}`;
  return { title: translate(titleKey, params), body: translate(`notif.body.${n.type}`, params) };
}
