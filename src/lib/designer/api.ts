import { apiGet, apiSend } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { PackageId, ProjectKind, RedesignInputs, ScratchInputs } from '@/lib/designer/shared';

export interface PackageView {
  id: PackageId;
  name: string;
  pricePence: number;
  description: string;
  features: string[];
  concepts: number;
  pdfLevel: number;
  recommended: boolean;
}

export interface ProjectView {
  id: string;
  reference: string;
  kind: ProjectKind;
  title: string;
  status: 'draft' | 'awaiting_payment' | 'paid' | 'complete';
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
  packageId: PackageId;
  package: { name: string; pricePence: number; concepts: number; pdfLevel: number };
  inputs: Record<string, unknown>;
  hasOriginal: boolean;
  selectedConcept: number;
  images: { index: number; status: 'generating' | 'ready' | 'failed'; error: string | null }[];
  pdf: { ready: boolean; level: number | null; generatedAt: string | null };
}

const BASE = '/api/designer';

export async function fetchPackages() {
  const data = await apiGet<{ packages: PackageView[] }>(`${BASE}/packages`);
  return data.packages;
}

/** Shrinks a photograph in the browser so uploads stay small and reliable. */
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    if (file.size > 8 * 1024 * 1024) throw new Error('Please choose a photograph smaller than 8 MB');
    return file;
  }
  const maxSide = 2000;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return blob || file;
}

export async function uploadGardenPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Please choose a JPEG, PNG or WebP photograph');
  }
  const blob = await prepareImage(file);
  const contentType = blob.type === 'image/png' || blob.type === 'image/webp' ? blob.type : 'image/jpeg';
  const signed = await apiSend<{ path: string; token: string }>(`${BASE}/upload-url`, 'POST', {
    filename: file.name,
    contentType,
  });
  const { error } = await supabase.storage.from('designer-files').uploadToSignedUrl(signed.path, signed.token, blob, { contentType });
  if (error) throw new Error('The photograph could not be uploaded. Please try again.');
  return signed.path;
}

export async function createProject(input: {
  kind: ProjectKind;
  packageId: PackageId;
  title?: string;
  inputs: RedesignInputs | ScratchInputs;
  originalPath?: string;
}) {
  const data = await apiSend<{ project: ProjectView }>(`${BASE}/create`, 'POST', input);
  return data.project;
}

export async function updateProject(input: {
  projectId: string;
  packageId?: PackageId;
  title?: string;
  inputs?: RedesignInputs | ScratchInputs;
  selectedConcept?: number;
}) {
  const data = await apiSend<{ project: ProjectView }>(`${BASE}/update`, 'POST', input);
  return data.project;
}

export async function getProject(id: string) {
  const data = await apiGet<{ project: ProjectView }>(`${BASE}/project?id=${encodeURIComponent(id)}`);
  return data.project;
}

export async function listProjects() {
  const data = await apiGet<{ projects: ProjectView[] }>(`${BASE}/projects`);
  return data.projects;
}

export async function startCheckout(projectId: string, email: string) {
  const data = await apiSend<{ url: string }>(`${BASE}/checkout`, 'POST', { projectId, email });
  return data.url;
}

export async function verifyPayment(projectId: string, sessionId: string) {
  const data = await apiSend<{ project: ProjectView }>(`${BASE}/verify`, 'POST', { projectId, sessionId });
  return data.project;
}

export async function generateConcept(projectId: string, conceptIndex: number) {
  const data = await apiSend<{ project: ProjectView }>(`${BASE}/generate`, 'POST', { projectId, conceptIndex });
  return data.project;
}

export async function createPdf(projectId: string) {
  const data = await apiSend<{ project: ProjectView }>(`${BASE}/pdf`, 'POST', { projectId });
  return data.project;
}

export function fileUrl(projectId: string, kind: 'original' | 'concept' | 'pdf', options: { index?: number; download?: boolean; v?: string } = {}) {
  const params = new URLSearchParams({ id: projectId, kind });
  if (options.index) params.set('index', String(options.index));
  if (options.download) params.set('dl', '1');
  if (options.v) params.set('v', options.v);
  return `${BASE}/file?${params.toString()}`;
}

export function requestRecovery(email: string) {
  return apiSend<{ ok: boolean; message: string }>(`${BASE}/recover-request`, 'POST', { email });
}

export function redeemRecovery(token: string) {
  return apiSend<{ ok: boolean }>(`${BASE}/recover-redeem`, 'POST', { token });
}

export function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
