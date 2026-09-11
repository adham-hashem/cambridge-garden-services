import { supabase } from '@/lib/supabase';

type ApiErrorBody = {
  error?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error || 'Request failed');
  }
  return body as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  return parseResponse<T>(response);
}

export async function apiSend<T>(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

function assertUploadableImage(file: File) {
  const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  if (!validTypes.has(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be smaller than 10 MB');
  }
}

export type UploadFolder = 'bookings' | 'before' | 'after' | 'articles' | 'climate' | 'services' | 'testimonials' | 'inspiration';

export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  assertUploadableImage(file);

  try {
    const signed = await apiSend<{ path: string; token: string }>('/api/uploads', 'POST', {
      folder,
      filename: file.name,
      contentType: file.type,
    });

    const { error } = await supabase.storage
      .from('project-images')
      .uploadToSignedUrl(signed.path, signed.token, file);

    if (error) throw error;

    const { data } = supabase.storage.from('project-images').getPublicUrl(signed.path);
    return data.publicUrl;
  } catch (error) {
    console.warn('Backend upload unavailable, using client fallback:', error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
}

export async function deleteImageByPath(path: string) {
  await apiSend('/api/uploads', 'DELETE', { path });
}
