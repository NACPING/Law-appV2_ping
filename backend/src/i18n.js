// ข้อความที่ backend ส่งกลับไปให้ผู้ใช้ (error/สำเร็จ) — แยกภาษาไทย/อังกฤษ
// แอปส่ง header Accept-Language: th | en มากับทุกคำขอ → req.t(key, params) เลือกภาษาให้
// (การแจ้งเตือนและข้อความระบบในแชทไม่อยู่ที่นี่ — backend เก็บเป็นรหัส แล้วแอปแปลเองตอนแสดงผล)

const messages = {
  th: {
    server: { internal: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' },
    auth: {
      required: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
      emailFormat: 'รูปแบบอีเมลไม่ถูกต้อง',
      passwordShort: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      invalidRole: 'บทบาทไม่ถูกต้อง',
      dobFormat: 'วันเกิดต้องอยู่ในรูปแบบ YYYY-MM-DD',
      duplicate: 'อีเมลหรือเลขบัตร/พาสปอร์ตนี้ถูกใช้งานแล้ว',
      registered: 'สมัครสมาชิกสำเร็จ',
      loginRequired: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน',
      badCredentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      userNotFound: 'ไม่พบผู้ใช้',
      pleaseLogin: 'กรุณาเข้าสู่ระบบ',
      sessionExpired: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
      forbidden: 'ไม่มีสิทธิ์เข้าถึง',
    },
    upload: {
      imageType: 'รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif, heic)',
      imageSize: 'รูปแต่ละรูปต้องมีขนาดไม่เกิน {mb} MB',
      imageCount: 'แนบรูปได้สูงสุด {n} รูป',
      chatFileType: 'แนบได้เฉพาะรูปภาพหรือไฟล์ PDF',
      chatFileInvalid: 'แนบได้เฉพาะรูปภาพหรือไฟล์ PDF (ไฟล์นี้ไม่ใช่รูปหรือ PDF ที่ถูกต้อง)',
      chatFileSize: 'ไฟล์ต้องมีขนาดไม่เกิน {mb} MB',
      chatFileCount: 'แนบได้ครั้งละ 1 ไฟล์',
    },
    post: {
      notFound: 'ไม่พบโพสต์',
      titleContent: 'กรุณากรอกหัวข้อและรายละเอียด',
      tooLong: 'หัวข้อไม่เกิน {title} ตัว, รายละเอียดไม่เกิน {content} ตัว',
      noPermDelete: 'ไม่มีสิทธิ์ลบโพสต์นี้',
      commentEmpty: 'กรุณาพิมพ์ความคิดเห็น',
      commentTooLong: 'ความคิดเห็นไม่เกิน {max} ตัวอักษร',
      replyNotFound: 'ไม่พบความคิดเห็นที่ต้องการตอบกลับ',
      commentNotFound: 'ไม่พบความคิดเห็น',
      noPermDeleteComment: 'ไม่มีสิทธิ์ลบความคิดเห็นนี้',
      lawyerCannotPost: 'ทนายความไม่สามารถสร้างโพสต์ได้ แต่แสดงความคิดเห็นได้',
    },
    ebook: { notFound: 'ไม่พบหนังสือ' },
    follow: {
      self: 'ติดตามตัวเองไม่ได้',
      notAllowed: 'ติดตามได้เฉพาะระหว่างบัญชีลูกความและทนาย',
    },
    request: {
      subjectEvents: 'กรุณากรอกหัวข้อและลำดับเหตุการณ์',
      tooLong: 'หัวข้อไม่เกิน {subject} ตัว, ลำดับเหตุการณ์ไม่เกิน {events} ตัว, ข้อความไม่เกิน {message} ตัว',
      notFound: 'ไม่พบคำขอ',
      cancelOnlyPending: 'ยกเลิกได้เฉพาะคำขอที่ยังรอตรวจสอบ',
      alreadyReviewed: 'คำขอนี้ได้รับการพิจารณาไปแล้ว',
      chooseLawyer: 'กรุณาเลือกทนายที่จะมอบหมาย',
      closeAlready: 'ส่งคำขอปิดเคสไปแล้วหรือเคสนี้ปิดแล้ว',
      closeNoPending: 'ไม่มีคำขอปิดเคสที่รอการตอบ',
      closeNoPendingMaybe: 'ไม่มีคำขอปิดเคสที่รอการตอบ (ทนายอาจยกเลิกไปแล้ว)',
      reasonRequired: 'กรุณาระบุเหตุผลที่ปฏิเสธ',
      reasonTooLong: 'เหตุผลไม่เกิน 500 ตัวอักษร',
    },
    chat: {
      notFound: 'ไม่พบห้องแชท',
      caseClosed: 'เคสนี้ปิดแล้ว ส่งข้อความเพิ่มไม่ได้',
      textOrFile: 'กรุณาพิมพ์ข้อความหรือแนบไฟล์',
      textTooLong: 'ข้อความไม่เกิน {max} ตัวอักษร',
      fileLinkExpired: 'ลิงก์ไฟล์หมดอายุ กรุณาเปิดห้องแชทใหม่',
      fileNotFound: 'ไม่พบไฟล์',
    },
    user: {
      nameRequired: 'กรุณากรอกชื่อและนามสกุล',
      nameTooLong: 'ชื่อและนามสกุลไม่เกิน {max} ตัวอักษร',
      phoneFormat: 'เบอร์โทรใช้ได้เฉพาะตัวเลข + - และเว้นวรรค (ไม่เกิน 20 ตัว)',
      bioTooLong: 'คำแนะนำตัวไม่เกิน {max} ตัวอักษร',
      aboutTooLong: 'รายละเอียดทนายไม่เกิน {max} ตัวอักษร',
      chooseImage: 'กรุณาเลือกรูปภาพ',
      passwordFields: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่',
      newPasswordShort: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร',
      currentPasswordWrong: 'รหัสผ่านเดิมไม่ถูกต้อง',
      passwordChanged: 'เปลี่ยนรหัสผ่านสำเร็จ',
    },
  },
  en: {
    server: { internal: 'Server error' },
    auth: {
      required: 'Please fill in all required fields',
      emailFormat: 'Invalid email format',
      passwordShort: 'Password must be at least 6 characters',
      invalidRole: 'Invalid role',
      dobFormat: 'Date of birth must be in YYYY-MM-DD format',
      duplicate: 'This email or ID/passport is already in use',
      registered: 'Account created',
      loginRequired: 'Please enter your email and password',
      badCredentials: 'Incorrect email or password',
      userNotFound: 'User not found',
      pleaseLogin: 'Please log in',
      sessionExpired: 'Your session has expired. Please log in again.',
      forbidden: 'Access denied',
    },
    upload: {
      imageType: 'Only image files are supported (jpg, png, webp, gif, heic)',
      imageSize: 'Each image must be {mb} MB or smaller',
      imageCount: 'You can attach up to {n} images',
      chatFileType: 'Only images or PDF files can be attached',
      chatFileInvalid: 'Only images or PDF files can be attached (this file is not a valid image or PDF)',
      chatFileSize: 'File must be {mb} MB or smaller',
      chatFileCount: 'You can attach 1 file at a time',
    },
    post: {
      notFound: 'Post not found',
      titleContent: 'Please enter a title and details',
      tooLong: 'Title up to {title} characters, details up to {content} characters',
      noPermDelete: 'You cannot delete this post',
      commentEmpty: 'Please write a comment',
      commentTooLong: 'Comments can be up to {max} characters',
      replyNotFound: 'The comment you are replying to was not found',
      commentNotFound: 'Comment not found',
      noPermDeleteComment: 'You cannot delete this comment',
      lawyerCannotPost: 'Lawyers cannot create posts, but can comment',
    },
    ebook: { notFound: 'Book not found' },
    follow: {
      self: 'You cannot follow yourself',
      notAllowed: 'Only client and lawyer accounts can follow each other',
    },
    request: {
      subjectEvents: 'Please enter a subject and the sequence of events',
      tooLong: 'Subject up to {subject}, events up to {events}, message up to {message} characters',
      notFound: 'Request not found',
      cancelOnlyPending: 'Only pending requests can be cancelled',
      alreadyReviewed: 'This request has already been reviewed',
      chooseLawyer: 'Please choose a lawyer to assign',
      closeAlready: 'A close request was already sent or the case is closed',
      closeNoPending: 'There is no pending close request',
      closeNoPendingMaybe: 'There is no pending close request (the lawyer may have cancelled it)',
      reasonRequired: 'Please enter a reason for rejection',
      reasonTooLong: 'The reason can be up to 500 characters',
    },
    chat: {
      notFound: 'Chat not found',
      caseClosed: 'This case is closed. You cannot send more messages.',
      textOrFile: 'Please type a message or attach a file',
      textTooLong: 'Messages can be up to {max} characters',
      fileLinkExpired: 'The file link has expired. Please reopen the chat.',
      fileNotFound: 'File not found',
    },
    user: {
      nameRequired: 'Please enter your first and last name',
      nameTooLong: 'First and last name can be up to {max} characters',
      phoneFormat: 'Phone numbers can only contain digits, + - and spaces (up to 20)',
      bioTooLong: 'Bio can be up to {max} characters',
      aboutTooLong: 'About can be up to {max} characters',
      chooseImage: 'Please choose an image',
      passwordFields: 'Please enter your current and new password',
      newPasswordShort: 'New password must be at least 6 characters',
      currentPasswordWrong: 'Current password is incorrect',
      passwordChanged: 'Password changed',
    },
  },
};

const DEFAULT_LANG = 'th';

// "en-US,en;q=0.9" → "en" · ภาษาที่ไม่รองรับ → ไทย
function pickLanguage(header) {
  const first = String(header ?? '').split(',')[0].trim().slice(0, 2).toLowerCase();
  return messages[first] ? first : DEFAULT_LANG;
}

function translate(lang, key, params) {
  const lookup = (dict) => key.split('.').reduce((o, k) => o?.[k], dict);
  const text = lookup(messages[lang]) ?? lookup(messages[DEFAULT_LANG]) ?? key;
  return params ? text.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? String(params[k]) : m)) : text;
}

// ใส่ไว้ก่อนทุก route: req.lang, req.t(key, params)
function languageMiddleware(req, res, next) {
  req.lang = pickLanguage(req.headers['accept-language']);
  req.t = (key, params) => translate(req.lang, key, params);
  next();
}

module.exports = { languageMiddleware, translate, pickLanguage };
