import type { ApiRequest, ApiResponse } from './types.js';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function setSecurityHeaders(res: ApiResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export function sendJson(res: ApiResponse, status: number, body: unknown) {
  setSecurityHeaders(res);
  res.status(status).json(body);
}

export function sendError(res: ApiResponse, error: unknown) {
  if (error instanceof HttpError) {
    sendJson(res, error.status, { error: error.message });
    return;
  }

  console.error(error);
  sendJson(res, 500, { error: 'Internal server error' });
}

export function assertMethod(req: ApiRequest, methods: string[]) {
  if (!req.method || !methods.includes(req.method)) {
    throw new HttpError(405, 'Method not allowed');
  }
}

export function assertSameOrigin(req: ApiRequest) {
  const origin = getQueryString(req.headers.origin);
  if (!origin) return;

  const host = getQueryString(req.headers['x-forwarded-host']) || getQueryString(req.headers.host);
  if (!host) return;

  const allowedOrigin = process.env.SITE_ORIGIN;
  const allowedHosts = new Set([host]);
  if (allowedOrigin) {
    try {
      allowedHosts.add(new URL(allowedOrigin).host);
    } catch {
      throw new HttpError(500, 'SITE_ORIGIN is invalid');
    }
  }

  try {
    if (!allowedHosts.has(new URL(origin).host)) {
      throw new HttpError(403, 'Request origin is not allowed');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(403, 'Request origin is not allowed');
  }
}

export function getBody<T extends Record<string, unknown>>(req: ApiRequest): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      throw new HttpError(400, 'Invalid JSON body');
    }
  }
  return req.body as T;
}

export function getQueryString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getPagination(req: ApiRequest) {
  const page = Math.max(0, Number.parseInt(getQueryString(req.query.page) || '0', 10) || 0);
  const requestedPageSize = Number.parseInt(getQueryString(req.query.pageSize) || '10', 10) || 10;
  const pageSize = Math.min(50, Math.max(1, requestedPageSize));
  return { page, pageSize, from: page * pageSize, to: page * pageSize + pageSize - 1 };
}

export function cleanSearch(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().replace(/[%_,()]/g, '').slice(0, 80);
  return cleaned || undefined;
}

export function requireString(value: unknown, name: string, maxLength = 500): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${name} is required`);
  }
  return value.trim().slice(0, maxLength);
}

export function optionalString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function pick<T extends Record<string, unknown>>(input: Record<string, unknown>, fields: (keyof T)[]) {
  return fields.reduce<Partial<T>>((output, field) => {
    const key = String(field);
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      output[field] = input[key] as T[keyof T];
    }
    return output;
  }, {});
}
