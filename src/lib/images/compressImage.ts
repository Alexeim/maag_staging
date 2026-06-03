const MAX_WIDTH = 1920;
const WEBP_QUALITY = 0.82;
const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];
const HEIC_EXTENSIONS = ['.heic', '.heif'];

function isHeic(file: File): boolean {
  if (HEIC_MIME_TYPES.includes(file.type.toLowerCase())) return true;
  const name = file.name.toLowerCase();
  return HEIC_EXTENSIONS.some((ext) => name.endsWith(ext));
}

async function convertHeicToBlob(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 1 });
  return Array.isArray(result) ? result[0] : result;
}

async function resizeAndConvertToWebP(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;

  const scale = width > MAX_WIDTH ? MAX_WIDTH / width : 1;
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Canvas toBlob failed'))),
      'image/webp',
      WEBP_QUALITY,
    );
  });
}

export async function compressImage(file: File): Promise<File> {
  const source = isHeic(file) ? await convertHeicToBlob(file) : file;
  const webpBlob = await resizeAndConvertToWebP(source);
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([webpBlob], `${baseName}.webp`, { type: 'image/webp' });
}
