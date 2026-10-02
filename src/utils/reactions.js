// รีแอคชันโพสต์ที่ตกลงกับเจ้าของ (ลำดับ = ลำดับในแถบเลือก) — type ต้องตรงกับ REACTION_TYPES ใน backend
// ชื่อแต่ละแบบอยู่ใน i18n: reaction.<type>
export const REACTIONS = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'SAD', emoji: '😢' },
  { type: 'THANKS', emoji: '🙏' },
];

export const reactionEmoji = (type) => REACTIONS.find((r) => r.type === type)?.emoji ?? '👍';
