import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { assertMethod, assertSameOrigin, sendError, sendJson } from '../_lib/http.js';
import { clearSessionCookie } from '../_lib/auth.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['POST']);
    assertSameOrigin(req);
    res.setHeader('Set-Cookie', clearSessionCookie());
    sendJson(res, 200, { authenticated: false });
  } catch (error) {
    sendError(res, error);
  }
}
