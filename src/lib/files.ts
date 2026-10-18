/**
 * Client-side file helpers. Images are downscaled and stored as data URLs so the
 * demo works without a server. When a backend exists, swap these for uploads to storage.
 */

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

export async function pickImages(opts: { multiple?: boolean; capture?: boolean } = {}) {
  const files = await pickFiles({ accept: 'image/*', ...opts });
  return Promise.all(files.map((f) => imageToDataUrl(f)));
}

/** Documents (PDF/Word/images). Only the name is kept in the demo; images also get a preview. */
export async function pickDocument() {
  const [file] = await pickFiles({ accept: '.pdf,.doc,.docx,image/*' });
  if (!file) return undefined;
  const preview = file.type.startsWith('image/') ? await imageToDataUrl(file, 600) : undefined;
  return { name: file.name, preview };
}
