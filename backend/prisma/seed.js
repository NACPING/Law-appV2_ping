// ข้อมูลตัวอย่างสำหรับหน้า Communication — รัน: npm run db:seed
// บัญชีทดสอบทุกบัญชีใช้รหัสผ่าน SEED_PASSWORD (ค่าเริ่มต้น password123)
// รูปภาพจาก Unsplash (ใช้ฟรีตาม Unsplash License)
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { seedEbooks } = require('./seedEbooks');
const { seedLawyerRequests, seedChatMessages } = require('./seedLawyerRequests');

const prisma = new PrismaClient();
const img = (id) => `https://images.unsplash.com/photo-${id}?w=600&q=70&auto=format&fit=crop`;
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

const USERS = [
  { key: 'somchai', idCard: 'SEED-L-001', firstName: 'สมชาย', lastName: 'ใจธรรม', email: 'somchai.lawyer@example.com', role: 'LAWYER' },
  { key: 'wipa', idCard: 'SEED-L-002', firstName: 'วิภาวดี', lastName: 'ศรีสุข', email: 'wipawadee.lawyer@example.com', role: 'LAWYER' },
  { key: 'nattapol', idCard: 'SEED-C-001', firstName: 'ณัฐพล', lastName: 'มีสุข', email: 'nattapol@example.com', role: 'CLIENT' },
  { key: 'kittiporn', idCard: 'SEED-C-002', firstName: 'กิตติพร', lastName: 'แสงทอง', email: 'kittiporn@example.com', role: 'CLIENT' },
  { key: 'pimchanok', idCard: 'SEED-C-003', firstName: 'พิมพ์ชนก', lastName: 'ทองดี', email: 'pimchanok@example.com', role: 'CLIENT' },
  // ADMIN สมัครผ่านแอปไม่ได้ — สร้างจาก seed เท่านั้น
  { key: 'admin', idCard: 'SEED-A-001', firstName: 'ผู้ดูแล', lastName: 'ระบบ', email: 'admin@example.com', role: 'ADMIN' },
];

const SIGN_CONTRACT_TITLE = 'ก่อนเซ็นสัญญาควรตรวจอะไรบ้าง?';
const SIGN_CONTRACT_ANSWER =
  'สรุป 5 ข้อที่ควรเช็กค่ะ\n' +
  '1) ชื่อและข้อมูลคู่สัญญาถูกต้องตรงกับบัตรประชาชน/หนังสือรับรองบริษัท\n' +
  '2) จำนวนเงิน วันครบกำหนด และวิธีชำระเขียนชัดเจน\n' +
  '3) เงื่อนไขการเลิกสัญญาและค่าปรับ ไม่ควรสูงเกินความเสียหายจริง\n' +
  '4) ห้ามเซ็นเอกสารที่ยังมีช่องว่าง ให้ขีดฆ่าช่องว่างทุกช่อง\n' +
  '5) เก็บสำเนาสัญญาที่ลงชื่อครบทั้งสองฝ่ายไว้กับตัวเสมอ';

// ทุกโพสต์ต้องเป็นของ CLIENT (ทนายโพสต์ไม่ได้ ตอบได้แค่คอมเมนต์)
// comments: [authorKey, content, replyToIndex?]
const POSTS = [
  {
    author: 'nattapol',
    isAnonymous: true,
    hoursAgo: 2,
    title: 'เพื่อนให้ยืมเงินแต่คิดดอกเบี้ยเดือนละ 5% แบบนี้ผิดกฎหมายไหม?',
    content:
      'ยืมเงินเพื่อนมา 20,000 บาท ตกลงกันปากเปล่าว่าจะคิดดอกเบี้ยเดือนละ 5% ตอนนี้จ่ายดอกไปหลายเดือนแล้วแต่เงินต้นยังไม่ลดเลย ' +
      'อยากทราบว่าดอกเบี้ยแบบนี้เรียกได้จริงไหม แล้วถ้าไม่จ่ายต่อจะโดนฟ้องได้หรือเปล่าครับ',
    images: [img('1617203443952-6d2619f7ff4e'), img('1450101499163-c8848c66ca85')],
    comments: [
      ['somchai',
        'กู้ยืมระหว่างบุคคลทั่วไป กฎหมายให้คิดดอกเบี้ยได้ไม่เกินร้อยละ 15 ต่อปี (ป.พ.พ. มาตรา 654) หรือประมาณ 1.25% ต่อเดือน ' +
        'ถ้าตกลงเกินอัตรานี้ ข้อตกลงเรื่องดอกเบี้ยจะตกเป็นโมฆะทั้งหมด ผู้ให้กู้เรียกได้แค่เงินต้น และอาจมีความผิดอาญาตาม พ.ร.บ.ห้ามเรียกดอกเบี้ยเกินอัตราด้วยครับ'],
      ['nattapol', 'แล้วดอกเบี้ยที่จ่ายไปแล้วนำมาหักเงินต้นได้ไหมครับ', 0],
      ['somchai',
        'มีแนวคำพิพากษาที่ให้นำดอกเบี้ยที่จ่ายไปแล้วมาหักเงินต้น แต่ขึ้นกับข้อเท็จจริงแต่ละเรื่องครับ แนะนำให้เก็บหลักฐานการโอนทุกครั้งไว้ และถ้าจะฟ้องเรียกเงินกู้เกิน 2,000 บาท ' +
        'ผู้ให้กู้ต้องมีหลักฐานเป็นหนังสือลงลายมือชื่อผู้กู้ด้วย', 1],
    ],
  },
  {
    author: 'kittiporn',
    isAnonymous: false,
    hoursAgo: 5,
    title: 'หมดสัญญาเช่าคอนโดแล้ว เจ้าของยังไม่คืนเงินประกัน',
    content:
      'ย้ายออกจากคอนโดที่เช่ามา 1 ปี ห้องสภาพปกติ ส่งคืนกุญแจครบ แต่ผ่านมา 3 สัปดาห์แล้วเจ้าของยังไม่คืนเงินประกัน 2 เดือน ' +
      'อ้างว่าต้องรอหาผู้เช่าใหม่ก่อน แบบนี้ทำได้ไหมคะ',
    images: [
      img('1733244766159-f58f4184fd38'),
      img('1744782351841-9cc6b86a5add'),
      img('1741156386380-0236c72eb6f9'),
      img('1737442886747-9fb768b96ed2'),
    ],
    comments: [
      ['wipa',
        'ถ้าผู้ให้เช่าเป็นธุรกิจที่ปล่อยเช่าตั้งแต่ 5 ห้องขึ้นไป จะอยู่ภายใต้ประกาศคณะกรรมการว่าด้วยสัญญา พ.ศ. 2562 ซึ่งกำหนดให้คืนเงินประกันภายใน 7 วัน ' +
        'นับจากวันสิ้นสุดสัญญาหากไม่มีความเสียหาย และหักได้เฉพาะความเสียหายที่เกิดขึ้นจริงเท่านั้น การอ้างว่ารอผู้เช่าใหม่จึงฟังไม่ขึ้นค่ะ'],
      ['kittiporn', 'ถ้าเป็นเจ้าของรายเดียวปล่อยห้องเดียวล่ะคะ', 0],
      ['wipa',
        'กรณีนั้นใช้หลักทั่วไปตามสัญญาและ ป.พ.พ. ค่ะ แนะนำส่งหนังสือทวงถามเป็นลายลักษณ์อักษร แนบรูปสภาพห้องวันส่งคืน ' +
        'หากยังเพิกเฉยสามารถร้องเรียน สคบ. (1166) หรือฟ้องคดีผู้บริโภคได้ ค่าใช้จ่ายไม่สูงค่ะ', 1],
    ],
  },
  {
    author: 'pimchanok',
    isAnonymous: false,
    hoursAgo: 9,
    title: 'ถูกเลิกจ้างหลังทำงานมา 4 ปี ควรได้ค่าชดเชยเท่าไหร่?',
    content:
      'บริษัทแจ้งเลิกจ้างเพราะปรับโครงสร้าง ไม่ได้ทำผิดอะไร ทำงานมาครบ 4 ปีแล้ว HR บอกจะให้เงินเดือนเพิ่ม 1 เดือนเท่านั้น ' +
      'อยากรู้ว่าตามกฎหมายควรได้เท่าไหร่',
    images: [img('1521791055366-0d553872125f'), img('1562564055-71e051d33c19')],
    comments: [
      ['somchai',
        'ตาม พ.ร.บ.คุ้มครองแรงงาน มาตรา 118 อายุงานครบ 3 ปีแต่ไม่ครบ 6 ปี ต้องได้ค่าชดเชยไม่น้อยกว่าค่าจ้างอัตราสุดท้าย 180 วัน (ประมาณ 6 เดือน) ' +
        'อัตรานี้เป็นขั้นต่ำ บริษัทจ่ายน้อยกว่านี้ไม่ได้ครับ นอกจากนี้ถ้าไม่บอกกล่าวล่วงหน้าตามกฎหมาย ยังต้องจ่ายสินจ้างแทนการบอกกล่าวล่วงหน้าเพิ่มด้วย'],
      ['pimchanok', 'ขอบคุณค่ะ ถ้าบริษัทไม่ยอมจ่ายต้องไปติดต่อที่ไหนคะ', 0],
      ['somchai', 'ยื่นคำร้องต่อพนักงานตรวจแรงงานที่สำนักงานสวัสดิการและคุ้มครองแรงงานจังหวัดได้ฟรี หรือโทรสายด่วน 1506 กด 3 ครับ อย่าเพิ่งเซ็นเอกสารสละสิทธิ์ใดๆ', 1],
    ],
  },
  {
    author: 'nattapol',
    isAnonymous: false,
    hoursAgo: 20,
    title: 'ซื้อของออนไลน์ โอนเงินไปแล้วร้านบล็อก ต้องทำอย่างไร',
    content:
      'สั่งโทรศัพท์มือสองจากเพจ Facebook โอนเงินไป 8,500 บาท หลังโอนแม่ค้าบล็อกทันที เพจก็ปิดไปแล้ว ' +
      'มีแค่สลิปโอนกับแชท จะแจ้งความได้ที่ไหน มีโอกาสได้เงินคืนไหมครับ',
    images: [img('1605902711834-8b11c3e3ef2f'), img('1554672408-17407e0322ce'), img('1648091856362-62436bfb145a')],
    comments: [
      ['wipa',
        'รีบทำ 3 อย่างค่ะ 1) แคปแชท โปรไฟล์ร้าน และเก็บสลิปโอนเงินไว้ 2) แจ้งความออนไลน์ที่ thaipoliceonline.go.th หรือโทรสายด่วน 1441 ' +
        '3) ติดต่อธนาคารของเราเพื่อแจ้งระงับบัญชีปลายทางโดยเร็ว ยิ่งเร็วยิ่งมีโอกาสตามเงินคืนได้ กรณีนี้เข้าข่ายฉ้อโกงตามประมวลกฎหมายอาญาค่ะ'],
    ],
  },
  {
    author: 'kittiporn',
    isAnonymous: true,
    hoursAgo: 30,
    title: 'ขี่มอเตอร์ไซค์แล้วโดนรถเก๋งชน ค่ารักษาใครต้องจ่าย?',
    content:
      'ขี่มอเตอร์ไซค์กลับบ้านแล้วรถเก๋งเลี้ยวตัดหน้า ขาหักต้องผ่าตัด คู่กรณียังเถียงว่าใครผิด ' +
      'ตอนนี้ค่ารักษาเริ่มสูงมาก ต้องรอตำรวจสรุปก่อนหรือเปล่าคะถึงจะเบิกได้',
    images: [img('1713623311317-d3c43a4be4cf'), img('1597328290883-50c5787b7c7e')],
    comments: [
      ['somchai',
        'ไม่ต้องรอครับ พ.ร.บ.คุ้มครองผู้ประสบภัยจากรถ ให้ผู้บาดเจ็บได้ค่าเสียหายเบื้องต้นเป็นค่ารักษาตามจริงไม่เกิน 30,000 บาท โดยไม่ต้องรอพิสูจน์ว่าใครผิด ' +
        'ส่วนที่เกินจากนี้ค่อยเรียกจากฝ่ายที่ผิดหรือประกันภาคสมัครใจของคู่กรณีหลังได้ข้อยุติครับ'],
    ],
  },
  {
    author: 'pimchanok',
    isAnonymous: false,
    hoursAgo: 48,
    title: SIGN_CONTRACT_TITLE,
    content:
      'กำลังจะเซ็นสัญญาจ้างงานกับสัญญาเช่าบ้านในเดือนเดียวกัน ไม่เคยเซ็นสัญญาเองมาก่อน ' +
      'อยากทราบว่าก่อนเซ็นควรตรวจเรื่องอะไรบ้าง จะได้ไม่เสียเปรียบค่ะ',
    images: [
      img('1589829545856-d10d557cf95f'),
      img('1681505531034-8d67054e07f6'),
      img('1589391886645-d51941baf7fb'),
      img('1521587760476-6c12a4b040da'),
      img('1505547828843-176834e42154'),
    ],
    comments: [
      ['wipa', SIGN_CONTRACT_ANSWER],
      ['pimchanok', 'มีประโยชน์มากค่ะ ข้อ 4 ไม่เคยรู้มาก่อนเลย', 0],
    ],
  },
];

async function main() {
  const password = await bcrypt.hash(process.env.SEED_PASSWORD || 'password123', 10);

  const users = {};
  for (const { key, ...data } of USERS) {
    users[key] = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: { ...data, password },
    });
  }

  await seedEbooks(prisma);
  await seedLawyerRequests(prisma);
  await seedChatMessages(prisma);

  if ((await prisma.post.count()) > 0) {
    console.log('มีโพสต์อยู่แล้ว ข้ามการสร้างโพสต์ตัวอย่าง');
    return;
  }

  for (const p of POSTS) {
    const createdAt = hoursAgo(p.hoursAgo);
    const post = await prisma.post.create({
      data: {
        title: p.title,
        content: p.content,
        isAnonymous: p.isAnonymous,
        authorId: users[p.author].id,
        createdAt,
        images: { create: p.images.map((url, order) => ({ url, order })) },
      },
    });

    const created = [];
    for (const [i, [authorKey, content, replyTo]] of p.comments.entries()) {
      const comment = await prisma.comment.create({
        data: {
          content,
          postId: post.id,
          authorId: users[authorKey].id,
          parentId: replyTo === undefined ? null : created[replyTo].id,
          createdAt: new Date(createdAt.getTime() + (i + 1) * 20 * 60 * 1000),
        },
      });
      created.push(comment);
    }
  }
  console.log(`สร้างโพสต์ตัวอย่าง ${POSTS.length} โพสต์เรียบร้อย`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
