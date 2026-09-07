import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { assertMethod, sendError, sendJson } from '../_lib/http.js';
import { isAuthenticated, sendAuthenticated } from '../_lib/auth.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['GET']);
    if (!isAuthenticated(req)) {
      sendJson(res, 200, { authenticated: false, user: null });
      return;
    }
    sendAuthenticated(res);
  } catch (error) {
    sendError(res, error);
  }
}
