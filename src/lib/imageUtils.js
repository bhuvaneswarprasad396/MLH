export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImage(file) {
  if (!file) return 'No image selected.';
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Unsupported file type “${file.type || 'unknown'}”. Use PNG, JPG, WEBP, GIF or BMP.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is ${formatBytes(file.size)} — the limit is 8 MB. Crop or resize it and try again.`;
  }
  return null;
}

export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be read.'));
    img.src = url;
  });
}

/** Crop a File to the given rectangle (in natural image pixels) and return a new PNG File. */
export async function cropToFile(file, rect) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageFromUrl(url);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, Math.round(rect.x), Math.round(rect.y), width, height, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('That crop could not be created.');
    return new File([blob], 'screenshot-crop.png', { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}