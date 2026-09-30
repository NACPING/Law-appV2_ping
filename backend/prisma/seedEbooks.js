// หนังสือตัวอย่างสำหรับหน้า E-Book — ตัวบทกฎหมายไทยจริงจากเว็บไซต์หน่วยงานรัฐ
// ตัวบทกฎหมายไม่มีลิขสิทธิ์ตาม พ.ร.บ.ลิขสิทธิ์ พ.ศ. 2537 มาตรา 7
// คำอธิบาย (description) เขียนขึ้นใหม่เพื่อแอปนี้
const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../storage/ebooks');

const CATEGORIES = [
  { id: 'criminal', name: 'หมวดอาญา', color: '#7A2E2E', order: 1 },
  { id: 'civil', name: 'หมวดแพ่งและพาณิชย์', color: '#1E4E8C', order: 2 },
  { id: 'public', name: 'หมวดมหาชน', color: '#2E6446', order: 3 },
];

const EBOOKS = [
  {
    slug: 'penal-code',
    categoryId: 'criminal',
    title: 'ประมวลกฎหมายอาญา',
    description:
      'กฎหมายหลักว่าด้วยความผิดทางอาญาและโทษ แบ่งเป็น ภาค 1 บทบัญญัติทั่วไป ภาค 2 ความผิด และภาค 3 ลหุโทษ ' +
      'ใช้กำหนดว่าการกระทำใดเป็นความผิดและต้องรับโทษอย่างไร',
    issuer: 'สำนักงานคณะกรรมการกฤษฎีกา',
    source: 'เว็บไซต์รัฐสภา (parliament.go.th)',
    sourceUrl: 'https://www.parliament.go.th/aseanrelated_law/files/file_20170817114308_0.pdf',
    versionNote: 'ฉบับรวมแก้ไขเพิ่มเติม ปรับปรุงถึง 24 มีนาคม 2560',
    publishedLabel: 'พ.ศ. 2499',
    pageCount: 119,
  },
  {
    slug: 'criminal-procedure-code',
    categoryId: 'criminal',
    title: 'ประมวลกฎหมายวิธีพิจารณาความอาญา',
    description:
      'ขั้นตอนการดำเนินคดีอาญา ตั้งแต่การร้องทุกข์ สอบสวน จับ ค้น ขัง การฟ้องคดี ' +
      'การพิจารณาและพิพากษา ไปจนถึงอุทธรณ์ ฎีกา และการบังคับตามคำพิพากษา',
    issuer: 'สำนักงานคณะกรรมการกฤษฎีกา',
    source: 'เว็บไซต์วุฒิสภา (senate.go.th)',
    sourceUrl:
      'https://www.senate.go.th/assets/portals/28/fileups/146/files/%E0%B8%9E%E0%B8%B4%E0%B8%88%E0%B8%B2%E0%B8%A3%E0%B8%93%E0%B8%B2%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%AD%E0%B8%B2%E0%B8%8D%E0%B8%B2.pdf',
    versionNote: 'ฉบับรวมแก้ไขเพิ่มเติม ปรับปรุงถึง 11 กุมภาพันธ์ 2551 (ยังไม่รวมฉบับแก้ไขหลังจากนั้น)',
    publishedLabel: 'พ.ศ. 2477',
    pageCount: 114,
  },
  {
    slug: 'computer-crime-act',
    categoryId: 'criminal',
    title: 'พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์',
    description:
      'กำหนดความผิดเกี่ยวกับการเข้าถึงระบบหรือข้อมูลคอมพิวเตอร์โดยมิชอบ การนำเข้าข้อมูลอันเป็นเท็จ ' +
      'และหน้าที่ของผู้ให้บริการในการเก็บข้อมูลจราจรทางคอมพิวเตอร์',
    issuer: 'สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์ (ETDA)',
    source: 'เว็บไซต์ ETDA (etda.or.th)',
    sourceUrl:
      'https://www.etda.or.th/getattachment/e3c8aef2-00ce-4c91-abea-fef02fc7f07c/Computer-Crimes-Act-BE-2550-and-BE-2560.aspx',
    versionNote: 'พ.ศ. 2550 และที่แก้ไขเพิ่มเติม (ฉบับที่ 2) พ.ศ. 2560',
    publishedLabel: 'พ.ศ. 2550',
    pageCount: 14,
  },
  {
    slug: 'civil-commercial-code',
    categoryId: 'civil',
    title: 'ประมวลกฎหมายแพ่งและพาณิชย์',
    description:
      'กฎหมายหลักว่าด้วยสิทธิและหน้าที่ระหว่างเอกชน 6 บรรพ ได้แก่ หลักทั่วไป หนี้ เอกเทศสัญญา ' +
      'ทรัพย์สิน ครอบครัว และมรดก ครอบคลุมเรื่องสัญญา กู้ยืม เช่า ซื้อขาย และการสมรส',
    issuer: 'สำนักงานคณะกรรมการกฤษฎีกา',
    source: 'กรมการปกครอง (bora.dopa.go.th)',
    sourceUrl:
      'https://www.bora.dopa.go.th/wp-content/uploads/2025/10/%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%A1%E0%B8%A7%E0%B8%A5%E0%B8%81%E0%B8%8E%E0%B8%AB%E0%B8%A1%E0%B8%B2%E0%B8%A2%E0%B9%81%E0%B8%9E%E0%B9%88%E0%B8%87%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%9E%E0%B8%B2%E0%B8%93%E0%B8%B4%E0%B8%8A%E0%B8%A2%E0%B9%8C.pdf',
    versionNote: 'ฉบับรวมแก้ไขเพิ่มเติม ปรับปรุงถึง 10 พฤศจิกายน 2558',
    publishedLabel: 'บรรพ 1–2 ตรวจชำระใหม่ พ.ศ. 2535',
    pageCount: 328,
  },
  {
    slug: 'consumer-protection-act',
    categoryId: 'civil',
    title: 'พ.ร.บ.คุ้มครองผู้บริโภค',
    description:
      'คุ้มครองสิทธิของผู้บริโภคด้านการโฆษณา ฉลากสินค้า และสัญญา ' +
      'พร้อมกำหนดอำนาจหน้าที่ของคณะกรรมการคุ้มครองผู้บริโภค (สคบ.)',
    issuer: 'สำนักงานคณะกรรมการกฤษฎีกา',
    source: 'ศูนย์ข้อมูลข่าวสาร สขร. (infocenter.oic.go.th)',
    sourceUrl: 'https://infocenter.oic.go.th/FILEWEB/CABINFOCENTER26/DRAWER072/GENERAL/DATA0000/00000048.PDF',
    versionNote: 'ฉบับรวมแก้ไขเพิ่มเติมถึง พ.ศ. 2556 (ยังไม่รวมฉบับที่ 4 พ.ศ. 2562)',
    publishedLabel: 'พ.ศ. 2522',
    pageCount: 23,
  },
  {
    slug: 'road-accident-victims-act',
    categoryId: 'civil',
    title: 'พ.ร.บ.คุ้มครองผู้ประสบภัยจากรถ',
    description:
      'บังคับให้รถทุกคันทำประกันภัยภาคบังคับ (พ.ร.บ.รถ) และกำหนดค่าเสียหายเบื้องต้น ' +
      'ที่ผู้ประสบภัยได้รับโดยไม่ต้องรอพิสูจน์ว่าฝ่ายใดเป็นผู้กระทำผิด',
    issuer: 'สำนักงานคณะกรรมการกำกับและส่งเสริมการประกอบธุรกิจประกันภัย (คปภ.)',
    source: 'เว็บไซต์ คปภ. (oic.or.th)',
    sourceUrl: 'https://oiceservice.oic.or.th/document/Law/file/00430/00430_33219a6ccd9b8d04d55ba058b50519cc.pdf',
    versionNote: 'ตัวบทจากเว็บไซต์ คปภ.',
    publishedLabel: 'พ.ศ. 2535',
    pageCount: 21,
  },
  {
    slug: 'constitution-2560',
    categoryId: 'public',
    title: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย พุทธศักราช 2560',
    description:
      'กฎหมายสูงสุดของประเทศ 16 หมวดและบทเฉพาะกาล ว่าด้วยพระมหากษัตริย์ สิทธิและเสรีภาพของปวงชนชาวไทย ' +
      'รัฐสภา คณะรัฐมนตรี ศาล และองค์กรอิสระ',
    issuer: 'สำนักงานเลขาธิการสภาผู้แทนราษฎร',
    source: 'เว็บไซต์รัฐสภา (parliament.go.th)',
    sourceUrl:
      'https://web.parliament.go.th/assets/portals/1/files/01%20%E0%B8%A3%E0%B8%B1%E0%B8%90%E0%B8%98%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%99%E0%B8%B9%E0%B8%8D%E0%B9%81%E0%B8%AB%E0%B9%88%E0%B8%87%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%AD%E0%B8%B2%E0%B8%93%E0%B8%B2%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B8%A3%E0%B9%84%E0%B8%97%E0%B8%A2%20%E0%B8%9E_%E0%B8%A8_%202560%20%E0%B9%81%E0%B8%81%E0%B9%89%E0%B9%84%E0%B8%82%E0%B9%80%E0%B8%9E%E0%B8%B4%E0%B9%88%E0%B8%A1%E0%B9%80%E0%B8%95%E0%B8%B4%E0%B8%A1%20(%E0%B8%89%E0%B8%9A%E0%B8%B1%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%88%201)%20%E0%B8%9E%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B8%A8%E0%B8%B1%E0%B8%81%E0%B8%A3%E0%B8%B2%E0%B8%8A%202564.pdf',
    versionNote: 'รวมการแก้ไขเพิ่มเติม (ฉบับที่ 1) พุทธศักราช 2564',
    publishedLabel: 'พ.ศ. 2560',
    pageCount: 226,
  },
  {
    slug: 'pdpa-2562',
    categoryId: 'public',
    title: 'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล',
    description:
      'กำหนดหลักเกณฑ์การเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล สิทธิของเจ้าของข้อมูล ' +
      'หน้าที่ของผู้ควบคุมข้อมูล และบทกำหนดโทษ (PDPA)',
    issuer: 'ตัวบทตามที่ประกาศในราชกิจจานุเบกษา',
    source: 'เว็บไซต์ สคบ. (ocpb.go.th)',
    sourceUrl: 'https://www.ocpb.go.th/download/article/article_20190529115736.pdf',
    versionNote: 'ฉบับประกาศใช้',
    publishedLabel: 'พ.ศ. 2562',
    pageCount: 44,
  },
  {
    slug: 'administrative-procedure-act',
    categoryId: 'public',
    title: 'พ.ร.บ.วิธีปฏิบัติราชการทางปกครอง',
    description:
      'วางมาตรฐานขั้นตอนการออกคำสั่งทางปกครองของเจ้าหน้าที่รัฐ สิทธิของผู้ได้รับผลกระทบ ' +
      'การอุทธรณ์ และการเพิกถอนคำสั่งทางปกครอง',
    issuer: 'ตัวบทตามที่ประกาศในราชกิจจานุเบกษา',
    source: 'กรมสอบสวนคดีพิเศษ (dsi.go.th)',
    sourceUrl:
      'https://www.dsi.go.th/Files/Images/img25610830152719-%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%9A%E0%B8%B1%E0%B8%8D%E0%B8%8D%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%A7%E0%B8%B4%E0%B8%98%E0%B8%B5%E0%B8%9B%E0%B8%8F%E0%B8%B4%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B8%9B%E0%B8%81%E0%B8%84%E0%B8%A3%E0%B8%AD%E0%B8%872539.pdf',
    versionNote: 'ตัวบทจากเว็บไซต์ DSI',
    publishedLabel: 'พ.ศ. 2539',
    pageCount: 23,
  },
];

// ถ้ายังไม่มีไฟล์ในเครื่อง ดาวน์โหลดจาก sourceUrl (ตรวจว่าเป็น PDF จริง)
async function ensurePdf(ebook) {
  const file = path.join(STORAGE_DIR, `${ebook.slug}.pdf`);
  if (!fs.existsSync(file)) {
    console.log(`  ดาวน์โหลด ${ebook.title} ...`);
    const res = await fetch(ebook.sourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok || buf.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error(`ดาวน์โหลด ${ebook.slug} ไม่สำเร็จ (HTTP ${res.status}) — ลองวางไฟล์เองที่ ${file}`);
    }
    fs.writeFileSync(file, buf);
  }
  return fs.statSync(file).size;
}

async function seedEbooks(prisma) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });

  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }
  for (const e of EBOOKS) {
    const data = { ...e, fileSize: await ensurePdf(e) };
    await prisma.ebook.upsert({ where: { slug: e.slug }, update: data, create: data });
  }
  console.log(`e-book ${EBOOKS.length} เล่ม ใน ${CATEGORIES.length} หมวด พร้อมใช้งาน`);
}

module.exports = { seedEbooks };
