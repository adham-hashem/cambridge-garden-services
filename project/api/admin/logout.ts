import type { ApiRequest, ApiResponse } from '../_lib/types';
import { assertMethod, assertSameOrigin, sendError, sendJson } from '../_lib/http';
import { clearSessionCookie } from '../_lib/auth';

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
