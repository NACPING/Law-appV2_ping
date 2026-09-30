// แนบไฟล์ลงใน FormData (เว็บ): ต้องส่งเป็น File/Blob จริงของเบราว์เซอร์
export async function appendFile(form, field, asset, { fallbackName }) {
  const name = asset.fileName || asset.name || fallbackName;
  form.append(field, asset.file ?? (await (await fetch(asset.uri)).blob()), name);
}
