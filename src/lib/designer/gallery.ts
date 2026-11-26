import { apiGet, apiSend } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface PublicGalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface AdminGalleryImage extends PublicGalleryImage {
  enabled: boolean;
  sortOrder: number;
}

const ADMIN = '/api/admin/designer?resource=gallery';

export async function fetchPublicGallery() {
  const data = await apiGet<{ images: PublicGalleryImage[] }>('/api/designer/gallery');
  return data.images;
}

export async function fetchAdminGallery() {
  const data = await apiGet<{ images: AdminGalleryImage[] }>(ADMIN);
  return data.images;
}

/**
 * Resizes and re-encodes an upload in the browser. The carousel shows images at
 * about 320 px high and the lightbox shows them larger, so up to 1600 px high
 * keeps them sharp while cutting file size sharply.
 */
export async function optimiseGalleryImage(file: File): Promise<{ blob: Blob; contentType: string }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error(`${file.name}: only JPEG, PNG and WebP images are allowed`);
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name}: this image could not be read`);
  const scale = Math.min(1, 1600 / bitmap.height, 2400 / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is not available in this browser');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const encode = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode('image/webp', 0.86);
  if (webp && webp.type === 'image/webp') return { blob: webp, contentType: 'image/webp' };
  const jpeg = await encode('image/jpeg', 0.88);
  if (!jpeg) throw new Error(`${file.name}: could not be optimised`);
  return { blob: jpeg, contentType: 'image/jpeg' };
}

/** Optimises and uploads a file to the gallery bucket, returning its storage path. */
export async function uploadGalleryFile(file: File): Promise<string> {
  const { blob, contentType } = await optimiseGalleryImage(file);
  const signed = await apiSend<{ path: string; token: string }>(ADMIN, 'PATCH', { action: 'upload-url', contentType });
  const { error } = await supabase.storage.from('designer-gallery').uploadToSignedUrl(signed.path, signed.token, blob, { contentType });
  if (error) throw new Error(`${file.name}: upload failed`);
  return signed.path;
}

export async function addGalleryImage(path: string, alt: string) {
  await apiSend(ADMIN, 'PATCH', { action: 'add', path, alt });
}

export async function replaceGalleryImage(id: string, path: string) {
  await apiSend(ADMIN, 'PATCH', { action: 'replace', id, path });
}

export async function setGalleryEnabled(id: string, enabled: boolean) {
  await apiSend(ADMIN, 'PATCH', { action: 'toggle', id, enabled });
}

export async function setGalleryAlt(id: string, alt: string) {
  await apiSend(ADMIN, 'PATCH', { action: 'alt', id, alt });
}

export async function deleteGalleryImage(id: string) {
  await apiSend(ADMIN, 'PATCH', { action: 'delete', id });
}

export async function reorderGallery(ids: string[]) {
  await apiSend(ADMIN, 'PATCH', { action: 'reorder', ids });
}
