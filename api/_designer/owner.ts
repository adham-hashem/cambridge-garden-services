import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { HttpError } from '../_lib/http.js';
import { supabaseAdmin } from '../_lib/supabase.js';

const COOKIE = 'cgs_designer_owner';
const ONE_YEAR = 60 * 60 * 24 * 365;

function secret() {
  const value = process.env.DESIGNER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new HttpError(500, 'DESIGNER_SESSION_SECRET (or ADMIN_SESSION_SECRET) must be at least 32 characters');
  }
  return value;
}

export function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function readCookie(req: ApiRequest, name: string) {
  const raw = Array.isArray(req.headers.cookie) ? req.headers.cookie.join(';') : req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function cookieHeader(ownerId: string) {
  const token = `${ownerId}.${sign(ownerId)}`;
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${ONE_YEAR}`;
}

/** Returns the owner id from the signed cookie, or null. */
export function getOwnerId(req: ApiRequest): string | null {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const [ownerId, signature] = token.split('.');
  if (!ownerId || !signature || !safeEqual(signature, sign(ownerId))) return null;
  return ownerId;
}

export function requireOwner(req: ApiRequest) {
  const ownerId = getOwnerId(req);
  if (!ownerId) throw new HttpError(401, 'No saved projects found for this browser');
  return ownerId;
}

export async function ensureOwner(req: ApiRequest, res: ApiResponse) {
  const existing = getOwnerId(req);
  if (existing) {
    const { data } = await supabaseAdmin.from('designer_owners').select('id').eq('id', existing).maybeSingle();
    if (data) return existing;
  }
  const { data, error } = await supabaseAdmin.from('designer_owners').insert({}).select('id').single();
  if (error || !data) throw error || new HttpError(500, 'Could not create customer session');
  res.setHeader('Set-Cookie', cookieHeader(data.id));
  return data.id as string;
}

export function setOwnerCookie(res: ApiResponse, ownerId: string) {
  res.setHeader('Set-Cookie', cookieHeader(ownerId));
}
