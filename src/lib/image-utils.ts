// Browser-side image utilities — WebP conversion + resize via Canvas API

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const WEBP_QUALITY = 0.82;

export async function convertToWebP(file: File): Promise<File> {
  if (file.type === 'image/webp' && file.size < 500 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = calcDimensions(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/webp',
      WEBP_QUALITY,
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
}

function calcDimensions(w: number, h: number): { width: number; height: number } {
  if (w <= MAX_WIDTH && h <= MAX_HEIGHT) return { width: w, height: h };
  const ratio = Math.min(MAX_WIDTH / w, MAX_HEIGHT / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

// Base64 to WebP (for camera captures)
export async function base64ToWebP(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', WEBP_QUALITY));
    };
    img.src = base64;
  });
}
