// หน้า HTML ตัวอ่าน PDF (ใช้ pdf.js จาก cdnjs) — ใช้ได้ทั้ง WebView บนมือถือและ iframe บนเว็บ
// (WebView ของ Android แสดง PDF เองไม่ได้ จึงต้องใช้ pdf.js วาดทีละหน้า)
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

// theme = { background, text } พื้นรอบหน้ากระดาษ/ข้อความสถานะตามโหมดสว่าง-มืด (หน้ากระดาษยังขาวเสมอ)
// labels = ข้อความสถานะตามภาษาที่เลือก (หน้า HTML เรียก t() เองไม่ได้)
const DEFAULT_LABELS = { loading: 'Loading...', noViewer: 'PDF viewer unavailable', page: 'Page', openFailed: 'Cannot open: ' };
// options = { startPage, darkPages } จาก Settings > Reading preferences
//   startPage: เปิดแล้วเลื่อนไปหน้านี้ · darkPages: กลับสีหน้ากระดาษเป็นพื้นมืด
//   หน้าที่กำลังอ่านส่งกลับไปเป็นข้อความ { type: 'page', page } (ให้แอปจำไว้)
export function pdfViewerHtml(
  pdfUrl,
  theme = { background: '#E9E9EC', text: '#555' },
  labels = DEFAULT_LABELS,
  options = { startPage: 1, darkPages: false }
) {
  const startPage = Math.max(1, Math.floor(Number(options.startPage) || 1));
  const L = (s) => JSON.stringify(s); // ใส่ลงใน JS ของหน้า HTML อย่างปลอดภัย
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4">
<style>
  html, body { margin: 0; background: ${theme.background}; font-family: -apple-system, 'Segoe UI', sans-serif; }
  #pages { padding: 8px 0 48px; }
  .page { position: relative; margin: 0 auto 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
  .page canvas { display: block; width: 100%; height: 100%; }
  ${options.darkPages ? '.page { background: #1b1b1b; } .page canvas { filter: invert(0.92) hue-rotate(180deg); }' : ''}
  #status { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; color: ${theme.text}; font-size: 15px; text-align: center; padding: 24px; }
  #counter { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%); background: rgba(30,43,88,.85); color: #fff; font-size: 13px; padding: 5px 12px; border-radius: 14px; display: none; }
</style>
</head><body>
<div id="status">${labels.loading.replace(/</g, '&lt;')}</div>
<div id="pages"></div>
<div id="counter"></div>
<script src="${PDFJS}/pdf.min.js"></script>
<script>
(function () {
  var send = function (msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent !== window) window.parent.postMessage(s, '*');
  };
  var statusEl = document.getElementById('status');
  var pagesEl = document.getElementById('pages');
  var counterEl = document.getElementById('counter');
  if (!window.pdfjsLib) { statusEl.textContent = ${L(labels.noViewer)}; send({ type: 'error' }); return; }
  var workerSrc = '${PDFJS}/pdf.worker.min.js';
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  var width = Math.min(document.documentElement.clientWidth, 900) - 16;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // เบราว์เซอร์ไม่ยอมสร้าง Worker จากไฟล์ต่าง origin (cdnjs) จึงโหลดเป็น Blob ก่อน
  fetch(workerSrc)
    .then(function (r) { return r.text(); })
    .then(function (code) {
      var blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(blobUrl);
    })
    .catch(function () { /* ใช้ workerSrc ตามปกติ (pdf.js จะ fallback เอง) */ })
    .then(open);

  function open() { pdfjsLib.getDocument({
    url: ${JSON.stringify(pdfUrl)},
    cMapUrl: '${PDFJS}/cmaps/', cMapPacked: true,
    standardFontDataUrl: '${PDFJS}/standard_fonts/'
  }).promise.then(function (pdf) {
    return pdf.getPage(1).then(function (first) {
      var ratio = first.getViewport({ scale: 1 }).height / first.getViewport({ scale: 1 }).width;
      statusEl.style.display = 'none';
      counterEl.style.display = 'block';
      send({ type: 'loaded', pages: pdf.numPages });

      var rendered = {};
      var render = function (el) {
        var n = +el.dataset.page;
        if (rendered[n]) return;
        rendered[n] = true;
        pdf.getPage(n).then(function (page) {
          var vp = page.getViewport({ scale: 1 });
          var scale = (width / vp.width) * dpr;
          var v = page.getViewport({ scale: scale });
          var canvas = document.createElement('canvas');
          canvas.width = v.width; canvas.height = v.height;
          el.style.height = (width * vp.height / vp.width) + 'px';
          el.appendChild(canvas);
          page.render({ canvasContext: canvas.getContext('2d'), viewport: v });
        });
      };

      // วาดเฉพาะหน้าที่ใกล้จะเห็น เพื่อไม่ให้เปลืองหน่วยความจำกับเอกสารหลายร้อยหน้า
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) render(e.target); });
      }, { rootMargin: '800px 0px' });
      var current = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          counterEl.textContent = ${L(labels.page + ' ')} + e.target.dataset.page + ' / ' + pdf.numPages;
          send({ type: 'page', page: +e.target.dataset.page });
        });
      }, { threshold: 0.5 });

      for (var i = 1; i <= pdf.numPages; i++) {
        var el = document.createElement('div');
        el.className = 'page';
        el.dataset.page = i;
        el.style.width = width + 'px';
        el.style.height = (width * ratio) + 'px';
        pagesEl.appendChild(el);
        io.observe(el);
        current.observe(el);
      }

      // อ่านค้างไว้ → เลื่อนไปหน้านั้นเลย (ช่องว่างของทุกหน้าสร้างไว้แล้ว จึงเลื่อนได้ก่อนวาดเสร็จ)
      var start = Math.min(${startPage}, pdf.numPages);
      if (start > 1) pagesEl.children[start - 1].scrollIntoView();
    });
  }).catch(function (err) {
    statusEl.textContent = ${L(labels.openFailed)} + (err && err.message ? err.message : err);
    send({ type: 'error', message: String(err && err.message) });
  }); }
})();
</script>
</body></html>`;
}
