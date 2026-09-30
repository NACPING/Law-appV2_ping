// คำขอปรึกษาตัวอย่าง — ครบทั้ง 3 สถานะ (รอตรวจสอบ / อนุมัติ / ปฏิเสธ)
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

const REQUESTS = [
  {
    client: 'nattapol@example.com',
    status: 'APPROVED',
    lawyer: 'somchai.lawyer@example.com',
    hoursAgo: 30,
    subject: 'ถูกหลอกโอนเงินซื้อโทรศัพท์ออนไลน์ ต้องการดำเนินคดี',
    events:
      '1. วันที่ 20 ก.ย. สั่งซื้อโทรศัพท์มือสองจากเพจ Facebook ราคา 8,500 บาท\n' +
      '2. โอนเงินเข้าบัญชีส่วนตัวของแอดมินเพจ\n' +
      '3. หลังโอน แอดมินบล็อกและปิดเพจ\n' +
      '4. แจ้งความออนไลน์แล้ว ได้เลขรับแจ้งความ',
    message: 'อยากทราบว่าต้องเตรียมเอกสารอะไรเพิ่ม และมีโอกาสได้เงินคืนไหมครับ',
  },
  {
    client: 'kittiporn@example.com',
    status: 'PENDING',
    hoursAgo: 3,
    subject: 'เจ้าของคอนโดไม่คืนเงินประกันหลังหมดสัญญาเช่า',
    events:
      '1. เช่าคอนโด 1 ปี วางเงินประกัน 2 เดือน (16,000 บาท)\n' +
      '2. สัญญาสิ้นสุด ส่งคืนห้องและกุญแจครบ มีรูปถ่ายสภาพห้องวันส่งคืน\n' +
      '3. ผ่านไป 3 สัปดาห์ เจ้าของยังไม่คืนเงิน อ้างว่ารอผู้เช่าใหม่',
    message: 'ต้องการให้ทนายช่วยร่างหนังสือทวงถามค่ะ',
  },
  {
    client: 'pimchanok@example.com',
    status: 'REJECTED',
    hoursAgo: 50,
    rejectReason:
      'ข้อมูลลำดับเหตุการณ์ยังไม่เพียงพอ กรุณาระบุวันที่ถูกเลิกจ้าง อายุงาน และเอกสารที่ได้รับจากบริษัท แล้วส่งคำขอใหม่อีกครั้ง',
    subject: 'ถูกเลิกจ้าง',
    events: 'บริษัทให้ออก',
    message: null,
  },
];

async function seedLawyerRequests(prisma) {
  if ((await prisma.lawyerRequest.count()) > 0) {
    console.log('มีคำขอปรึกษาอยู่แล้ว ข้ามการสร้างคำขอตัวอย่าง');
    return;
  }
  const byEmail = async (email) => prisma.user.findUniqueOrThrow({ where: { email } });
  const admin = await byEmail('admin@example.com');

  for (const r of REQUESTS) {
    const createdAt = hoursAgo(r.hoursAgo);
    const reviewed = r.status !== 'PENDING';
    await prisma.lawyerRequest.create({
      data: {
        subject: r.subject,
        events: r.events,
        message: r.message,
        status: r.status,
        rejectReason: r.rejectReason ?? null,
        clientId: (await byEmail(r.client)).id,
        lawyerId: r.lawyer ? (await byEmail(r.lawyer)).id : null,
        reviewedById: reviewed ? admin.id : null,
        reviewedAt: reviewed ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
        createdAt,
      },
    });
  }
  console.log(`สร้างคำขอปรึกษาตัวอย่าง ${REQUESTS.length} รายการ`);
}

// แชทตัวอย่างในเคสที่อนุมัติแล้ว (ลูกความ ณัฐพล ↔ ทนาย สมชาย)
const CHAT = [
  ['lawyer', 'สวัสดีครับคุณณัฐพล ผมทนายสมชาย ได้รับมอบหมายให้ดูแลเรื่องนี้ครับ ขอดูสลิปการโอนเงินและแชทกับแอดมินเพจก่อนนะครับ'],
  ['client', 'สวัสดีครับทนาย เดี๋ยวผมส่งสลิปกับรูปแชทให้ครับ'],
  ['client', 'ได้เลขรับแจ้งความออนไลน์แล้วครับ ต้องทำอะไรต่อไหมครับ'],
  [
    'lawyer',
    'ขั้นต่อไปแนะนำ 3 ข้อครับ\n1. ติดต่อธนาคารของคุณพร้อมเลขรับแจ้งความ เพื่อขอให้ระงับบัญชีปลายทาง\n' +
      '2. เก็บหลักฐานทุกอย่างไว้ ห้ามลบแชท\n3. รอพนักงานสอบสวนติดต่อกลับ ถ้าเกิน 7 วันแจ้งผมได้เลยครับ',
  ],
];

async function seedChatMessages(prisma) {
  if ((await prisma.message.count()) > 0) return;
  const request = await prisma.lawyerRequest.findFirst({
    where: { status: 'APPROVED', client: { email: 'nattapol@example.com' } },
  });
  if (!request?.lawyerId) return;

  const start = (request.reviewedAt ?? new Date()).getTime() + 10 * 60 * 1000;
  for (const [i, [who, text]] of CHAT.entries()) {
    await prisma.message.create({
      data: {
        requestId: request.id,
        senderId: who === 'lawyer' ? request.lawyerId : request.clientId,
        text,
        createdAt: new Date(start + i * 7 * 60 * 1000),
      },
    });
  }
  console.log(`สร้างแชทตัวอย่าง ${CHAT.length} ข้อความ`);
}

module.exports = { seedLawyerRequests, seedChatMessages };
