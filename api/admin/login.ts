import type { ApiRequest, ApiResponse } from '../_lib/types';
import { assertMethod, assertSameOrigin, getBody, sendError, sendJson } from '../_lib/http';
import { createSessionCookie, validateCredentials } from '../_lib/auth';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['POST']);
    assertSameOrigin(req);
    const body = getBody<{ username?: unknown; password?: unknown }>(req);
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!validateCredentials(username, password)) {
      sendJson(res, 401, { error: 'Invalid username or password' });
      return;
    }

    res.setHeader('Set-Cookie', createSessionCookie());
    sendJson(res, 200, { authenticated: true, user: { username } });
  } catch (error) {
    sendError(res, error);
  }
}
