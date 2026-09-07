import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './types.js';
import { HttpError, sendJson } from './http.js';

const COOKIE_NAME = 'cgs_admin_session';
const SESSION_SECONDS = 60 * 60 * 8;

export function getAdminAuthConfigError() {
  if (!process.env.ADMIN_USERNAME) return 'ADMIN_USERNAME is not configured';
  if (!process.env.ADMIN_PASSWORD) return 'ADMIN_PASSWORD is not configured';
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    return 'ADMIN_SESSION_SECRET must be at least 32 characters';
  }
  return null;
}

function assertAdminAuthConfigured() {
  const configError = getAdminAuthConfigError();
  if (configError) {
    throw new HttpError(500, `Admin login is not configured: ${configError}`);
  }
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new HttpError(500, 'ADMIN_SESSION_SECRET must be at least 32 characters');
  }
  return secret;
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function equal(a: string, b: string) {
  const aHash = Buffer.from(createHmac('sha256', getSecret()).update(a).digest());
  const bHash = Buffer.from(createHmac('sha256', getSecret()).update(b).digest());
  return timingSafeEqual(aHash, bHash);
}

function parseCookies(req: ApiRequest) {
  const raw = Array.isArray(req.headers.cookie) ? req.headers.cookie.join(';') : req.headers.cookie || '';
  return raw.split(';').reduce<Record<string, string>>((cookies, part) => {
    const [name, ...rest] = part.trim().split('=');
    if (name) cookies[name] = decodeURIComponent(rest.join('='));
    return cookies;
  }, {});
}

export function validateCredentials(username: string, password: string) {
  assertAdminAuthConfigured();

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  return equal(username, expectedUsername as string) && equal(password, expectedPassword as string);
}

export function createSessionCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = randomBytes(18).toString('base64url');
  const payload = `${expiresAt}.${nonce}`;
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export function isAuthenticated(req: ApiRequest) {
  if (getAdminAuthConfigError()) return false;

  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [expiresAtRaw, nonce, signature] = parts;
  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = `${expiresAtRaw}.${nonce}`;
  return equal(signature, sign(payload));
}

export function requireAdmin(req: ApiRequest) {
  if (!isAuthenticated(req)) {
    throw new HttpError(401, 'Authentication required');
  }
}

export function sendAuthenticated(res: ApiResponse) {
  sendJson(res, 200, { authenticated: true, user: { username: process.env.ADMIN_USERNAME || 'admin' } });
}
