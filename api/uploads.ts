import { randomUUID } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './_lib/types';
import { assertMethod, assertSameOrigin, getBody, sendError, sendJson } from './_lib/http';
import { isAuthenticated, requireAdmin } from './_lib/auth';
import { assertSupabaseEnv, supabaseAdmin } from './_lib/supabase';

const publicFolders = new Set(['bookings']);
const adminFolders = new Set(['before', 'after', 'articles', 'climate']);
const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function extensionFor(filename: string, contentType: string) {
  const explicit = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (explicit && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(explicit)) return explicit;
  return contentType.split('/')[1] || 'jpg';
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['POST', 'DELETE']);
    assertSameOrigin(req);
    assertSupabaseEnv();

    const body = getBody<{ folder?: unknown; filename?: unknown; contentType?: unknown; path?: unknown }>(req);

    if (req.method === 'DELETE') {
      requireAdmin(req);
      const path = typeof body.path === 'string' ? body.path : '';
      if (!path || path.includes('..')) {
        sendJson(res, 400, { error: 'Valid image path is required' });
        return;
      }

      const { error } = await supabaseAdmin.storage.from('project-images').remove([path]);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const folder = typeof body.folder === 'string' ? body.folder : '';
    const filename = typeof body.filename === 'string' ? body.filename : 'upload.jpg';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';

    if (!publicFolders.has(folder) && !(adminFolders.has(folder) && isAuthenticated(req))) {
      sendJson(res, 401, { error: 'Authentication required' });
      return;
    }

    if (!imageMimeTypes.has(contentType)) {
      sendJson(res, 400, { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' });
      return;
    }

    const path = `${folder}/${Date.now()}-${randomUUID()}.${extensionFor(filename, contentType)}`;
    const { data, error } = await supabaseAdmin.storage.from('project-images').createSignedUploadUrl(path);
    if (error) throw error;

    sendJson(res, 200, {
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    sendError(res, error);
  }
}
