/**
 * Client-side file helpers. Images are downscaled in the browser. When logged in to the server they are uploaded
 * right away and the helpers return file urls; in the demo (or if the upload can't reach the server) they return data URLs.
 */
import { notify } from '@/components/toast';
import { api, ApiError, dataUrlToFile, getToken } from './api';

export function pickFiles(opts: { accept: string; multiple?: boolean; capture?: boolean }): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = opts.accept;
    input.multiple = !!opts.multiple;
    if (opts.capture) input.setAttribute('capture', 'environment');
    input.onchange = () => resolve(Array.from(input.files ?? []));
    // some browsers never fire change on cancel – that's fine, the promise just stays pending
    input.click();
  });
}

export function imageToDataUrl(file: File, max = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('לא ניתן לקרוא את התמונה'));
    };
    img.src = url;
  });
}

/**
 * Uploads when logged in. Returns undefined without a login (the dev demo keeps the local copy) and null when a
 * logged-in upload fails – a browser-only copy would vanish on the next sync, so the user is told to try again instead.
 */
async function tryUpload(files: File[]) {
  if (!getToken() || !files.length) return undefined;
  try {
    // the server takes up to 6 files per request
    const urls: string[] = [];
    for (let i = 0; i < files.length; i += 6) urls.push(...(await api.upload(files.slice(i, i + 6))).map((f) => f.url));
    return urls;
  } catch (e) {
    notify(e instanceof ApiError && e.code ? e.message : 'ההעלאה נכשלה, בדקו את החיבור ונסו שוב');
    return null;
  }
}

/** Same limit as the server (MAX_UPLOAD_MB) – checked here so a big file isn't uploaded only to be refused. */
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Picks photos, downscales them and uploads them when logged in. `max` caps how many are kept (e.g. 6 per update):
 * extra ones are dropped before uploading, with a message. Files that aren't readable images are skipped with a message.
 */
export async function pickImages(opts: { multiple?: boolean; capture?: boolean; max?: number } = {}) {
  let files = await pickFiles({ accept: 'image/*', ...opts });
  if (opts.max !== undefined && files.length > opts.max) {
    notify(`אפשר להוסיף עד ${opts.max} תמונות – נוספו הראשונות`);
    files = files.slice(0, Math.max(0, opts.max));
  }
  const read = await Promise.all(files.map((f) => imageToDataUrl(f).catch(() => null)));
  const local = read.filter((d): d is string => !!d);
  if (local.length < read.length) notify(read.length === 1 ? 'לא ניתן לקרוא את התמונה. בחרו קובץ תמונה אחר' : 'חלק מהקבצים אינם תמונות תקינות ולא נוספו');
  if (!local.length) return [];
  const urls = await tryUpload(await Promise.all(local.map((d, i) => dataUrlToFile(d, `image-${i + 1}.jpg`))));
  return urls === null ? [] : (urls ?? local);
}

/** Documents (PDF/Word/images). Uploaded when logged in (url); images also get a preview. */
export async function pickDocument() {
  const [file] = await pickFiles({ accept: '.pdf,.doc,.docx,image/*' });
  if (!file) return undefined;
  if (file.size > MAX_BYTES) {
    notify('הקובץ גדול מדי – עד 15MB');
    return undefined;
  }
  const isImage = file.type.startsWith('image/');
  const uploaded = await tryUpload([file]);
  if (uploaded === null) return undefined;
  const [url] = uploaded ?? [];
  const preview = isImage ? (url ?? (await imageToDataUrl(file, 600))) : undefined;
  return { name: file.name, preview, url };
}
