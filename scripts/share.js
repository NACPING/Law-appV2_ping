// npm run share — ให้เพื่อนลองแอปใน Expo Go จากที่ไหนก็ได้ (ไม่ต้องอยู่ Wi-Fi เดียวกัน)
// 1) ต้องเปิด backend ไว้ก่อน (npm run dev ในโฟลเดอร์ backend)
// 2) เปิดอุโมงค์ Cloudflare 2 อัน: backend (port 5000) และ Metro ที่ส่งตัวแอป (port 8081)
//    ไม่ใช้ `expo start --tunnel` เพราะบริการ ngrok ของ Expo หลุดบ่อย ("remote gone away")
// 3) เปิด Expo โดยบอกที่อยู่อุโมงค์ผ่าน env (ไม่แก้ไฟล์ .env):
//    EXPO_PACKAGER_PROXY_URL = ที่อยู่ของ Metro ที่ใส่ใน QR · EXPO_PUBLIC_API_URL = backend ที่แอปเรียก
// กด Ctrl+C เพื่อปิดทั้งหมด — คอมต้องเปิดค้างไว้ตลอดเวลาที่เพื่อนใช้ · ลิงก์เปลี่ยนทุกครั้งที่รันใหม่
const fs = require('fs');
const { spawn } = require('child_process');

const BACKEND_PORT = 5000;
const METRO_PORT = 8081;

// winget ติดตั้งไว้ที่ Program Files แต่ terminal ที่เปิดอยู่ก่อนติดตั้ง (เช่นใน VS Code) ยังไม่เห็น PATH ใหม่
// จึงลองตำแหน่งมาตรฐานก่อน ไม่งั้นต้องปิด-เปิด VS Code ทั้งโปรแกรม
const CLOUDFLARED =
  ['C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', 'C:\\Program Files\\cloudflared\\cloudflared.exe'].find((p) =>
    fs.existsSync(p)
  ) ?? 'cloudflared';

async function backendIsUp() {
  try {
    const res = await fetch(`http://localhost:${BACKEND_PORT}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// เปิดอุโมงค์ไปที่ port นี้ แล้วรอจน cloudflared บอกลิงก์ (พิมพ์ออกมาทาง stderr)
function startTunnel(port) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CLOUDFLARED, ['tunnel', '--url', `http://localhost:${port}`], { windowsHide: true });
    const timer = setTimeout(() => reject(new Error('รอลิงก์จาก cloudflared นานเกินไป (30 วินาที)')), 30000);
    const onData = (chunk) => {
      const m = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m) {
        clearTimeout(timer);
        resolve({ proc, url: m[0] });
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(
        err.code === 'ENOENT'
          ? new Error('ไม่พบ cloudflared — ติดตั้งด้วย: winget install --id Cloudflare.cloudflared แล้วเปิด terminal ใหม่')
          : err
      );
    });
  });
}

(async () => {
  if (!(await backendIsUp())) {
    console.error('❌ backend ยังไม่ได้เปิด — เปิด terminal อีกอันแล้วรัน: cd backend && npm run dev');
    process.exit(1);
  }

  console.log('⏳ กำลังเปิดอุโมงค์ให้ backend และตัวแอป...');
  const [backend, metro] = await Promise.all([startTunnel(BACKEND_PORT), startTunnel(METRO_PORT)]);
  const tunnels = [backend.proc, metro.proc];
  console.log(`✅ backend: ${backend.url}`);
  console.log(`✅ ตัวแอป:  ${metro.url}`);
  // Expo Go เปิดด้วย exp:// (= http) — อุโมงค์ Cloudflare รับ http ได้ จึงให้ QR เป็น http ของอุโมงค์
  const metroHttp = metro.url.replace('https://', 'http://');

  // -c = ล้าง cache: ค่า EXPO_PUBLIC_* ถูกฝังตอน bundle ถ้าไม่ล้างอาจยังใช้ลิงก์ของรอบก่อน
  // ส่งเป็นคำสั่งเดียว (ไม่แยก args) — Node รุ่นใหม่เตือนเมื่อใช้ args คู่กับ shell: true
  const expo = spawn(`npx expo start --lan --port ${METRO_PORT} -c`, {
    stdio: 'inherit',
    shell: true, // Windows ต้องใช้ shell ถึงจะเรียก npx ได้
    env: {
      ...process.env,
      EXPO_PUBLIC_API_URL: `${backend.url}/api`,
      EXPO_PACKAGER_PROXY_URL: metroHttp,
    },
  });

  const stopTunnels = () => tunnels.forEach((p) => p.kill());
  process.on('SIGINT', () => {
    stopTunnels();
    expo.kill();
  });
  expo.on('exit', (code) => {
    stopTunnels();
    process.exit(code ?? 0);
  });
})().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
