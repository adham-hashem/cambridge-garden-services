import { randomBytes, randomUUID } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { HttpError, assertMethod, assertSameOrigin, getBody, getQueryString, sendError, sendJson } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { assertSupabaseEnv, supabaseAdmin } from './_lib/supabase.js';
import { ensureOwner, requireOwner, safeEqual, setOwnerCookie, sign } from './_designer/owner.js';
import { createCheckoutSession, retrieveCheckoutSession, type StripeSession } from './_designer/stripe.js';
import { buildRedesignPrompt, buildScratchPrompt, generateFromPhoto, generateFromText } from './_designer/openai.js';
import { buildPdf, type PdfImage } from './_designer/pdf.js';
import {
  ELEMENT_TYPES,
  FEATURES,
  GARDEN_STYLES,
  LAWN_TYPES,
  MATERIAL_OPTIONS,
  PLANTS,
  clampElement,
  computePlan,
  round,
  type ElementType,
  type GardenStyle,
  type HouseSide,
  type LayoutElement,
  type PackageId,
  type ProjectKind,
  type RateMap,
  type RedesignInputs,
  type ScratchInputs,
} from '../src/lib/designer/shared.js';

const BUCKET = 'designer-files';
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const LOGO_PATH = '/WhatsApp_Image_2026-09-03_at_12.01.32_PM.jpeg';
const GENERATING_TIMEOUT_MS = 4 * 60 * 1000;
const MAX_PROJECTS_PER_OWNER = 40;

type ProjectRow = {
  id: string;
  reference: string;
  owner_id: string;
  kind: ProjectKind;
  package_id: PackageId;
  package_snapshot: { name: string; pricePence: number; concepts: number; pdfLevel: number };
  title: string;
  inputs: Record<string, unknown>;
  original_path: string | null;
  status: 'draft' | 'awaiting_payment' | 'paid' | 'complete';
  customer_email: string | null;
  paid_at: string | null;
  pdf_path: string | null;
  pdf_level: number | null;
  pdf_generated_at: string | null;
  created_at: string;
};

type PackageRow = {
  id: PackageId;
  name: string;
  price_pence: number;
  description: string;
  features: string[];
  concepts: number;
  pdf_level: number;
  recommended: boolean;
  active: boolean;
  sort_order: number;
};

type ImageRow = {
  id: string;
  project_id: string;
  concept_index: number;
  status: 'generating' | 'ready' | 'failed';
  path: string | null;
  error: string | null;
  updated_at: string;
};

/* ------------------------------ helpers ---------------------------------- */

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function num(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function origin(req: ApiRequest) {
  const host = getQueryString(req.headers['x-forwarded-host']) || getQueryString(req.headers.host) || '';
  if (host) {
    const proto = getQueryString(req.headers['x-forwarded-proto']) || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return process.env.SITE_ORIGIN || '';
}

function isStyle(value: unknown): value is GardenStyle {
  return GARDEN_STYLES.some((style) => style.id === value);
}

function sanitizeRedesign(raw: unknown): RedesignInputs {
  const source = (raw || {}) as Record<string, unknown>;
  if (!isStyle(source.style)) throw new HttpError(400, 'Please choose a garden style');
  return { style: source.style, instructions: str(source.instructions, 1500) };
}

function sanitizeScratch(raw: unknown): ScratchInputs {
  const source = (raw || {}) as Record<string, unknown>;
  const plotRaw = (source.plot || {}) as Record<string, unknown>;
  const houseSide = (['top', 'right', 'bottom', 'left'] as const).includes(plotRaw.houseSide as HouseSide)
    ? (plotRaw.houseSide as HouseSide)
    : 'top';
  const plot = { width: round(num(plotRaw.width, 2, 100, 0), 2), depth: round(num(plotRaw.depth, 2, 100, 0), 2), houseSide };
  if (plot.width < 2 || plot.depth < 2) throw new HttpError(400, 'Please enter the garden width and depth in metres (2 m to 100 m)');
  if (!isStyle(source.style)) throw new HttpError(400, 'Please choose a garden style');

  const elementTypes = new Set<string>(ELEMENT_TYPES.map((item) => item.type));
  const elements = (Array.isArray(source.elements) ? source.elements : [])
    .slice(0, 40)
    .map((item, index): LayoutElement | null => {
      const element = (item || {}) as Record<string, unknown>;
      if (!elementTypes.has(String(element.type))) return null;
      return clampElement(
        {
          id: str(element.id, 40) || `el-${index}`,
          type: element.type as ElementType,
          x: num(element.x, 0, plot.width, 0),
          y: num(element.y, 0, plot.depth, 0),
          w: num(element.w, 0.1, plot.width, 1),
          h: num(element.h, 0.1, plot.depth, 1),
        },
        plot
      );
    })
    .filter((item): item is LayoutElement => item !== null);

  const plantIds = new Set(PLANTS.map((plant) => plant.id));
  const featureIds = new Set(FEATURES.map((feature) => feature.id));
  const plants = (Array.isArray(source.plants) ? source.plants : []).map(String).filter((id) => plantIds.has(id)).slice(0, 30);
  const features = (Array.isArray(source.features) ? source.features : []).map(String).filter((id) => featureIds.has(id)).slice(0, 30);
  const countRecord = (value: unknown, allowed: Set<string>) => {
    const out: Record<string, number> = {};
    Object.entries((value || {}) as Record<string, unknown>).forEach(([key, qty]) => {
      if (allowed.has(key)) out[key] = Math.round(num(qty, 1, 10, 1));
    });
    return out;
  };
  const prefs = (source.preferences || {}) as Record<string, unknown>;
  const maintenance = ['low', 'medium', 'high'].includes(String(prefs.maintenance)) ? (prefs.maintenance as 'low' | 'medium' | 'high') : 'medium';
  const budgetRaw = prefs.budget === null || prefs.budget === '' || prefs.budget === undefined ? null : num(prefs.budget, 0, 10_000_000, 0);

  return {
    plot,
    elements,
    style: source.style,
    plants,
    treeCounts: countRecord(source.treeCounts, plantIds),
    lawnType: LAWN_TYPES.some((item) => item.id === source.lawnType) ? String(source.lawnType) : 'turf',
    features,
    featureQty: countRecord(source.featureQty, featureIds),
    preferences: {
      maintenance,
      materials: (Array.isArray(prefs.materials) ? prefs.materials : []).map(String).filter((item) => MATERIAL_OPTIONS.includes(item)),
      budget: budgetRaw && budgetRaw > 0 ? budgetRaw : null,
      instructions: str(prefs.instructions, 1500),
      special: str(prefs.special, 1000),
    },
  };
}

async function loadPackage(id: unknown) {
  const { data, error } = await supabaseAdmin.from('designer_packages').select('*').eq('id', String(id)).maybeSingle();
  if (error) throw error;
  if (!data || !data.active) throw new HttpError(400, 'That package is not available');
  return data as PackageRow;
}

async function loadRates(): Promise<RateMap> {
  const { data, error } = await supabaseAdmin.from('designer_rates').select('*');
  if (error) throw error;
  const rates: RateMap = {};
  (data || []).forEach((row) => {
    rates[row.key] = { label: row.label, unit: row.unit, ratePence: row.rate_pence };
  });
  return rates;
}

async function loadOwnedProject(req: ApiRequest, projectId: unknown) {
  const ownerId = requireOwner(req);
  const id = typeof projectId === 'string' ? projectId : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'Invalid project');
  const { data, error } = await supabaseAdmin.from('designer_projects').select('*').eq('id', id).eq('owner_id', ownerId).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Project not found');
  return data as ProjectRow;
}

function isPaid(project: ProjectRow) {
  return project.status === 'paid' || project.status === 'complete';
}

async function projectView(project: ProjectRow) {
  const { data: images } = await supabaseAdmin.from('designer_images').select('*').eq('project_id', project.id).order('concept_index');
  const inputs = { ...project.inputs };
  const selected = Number(inputs._selected) || 1;
  delete inputs._selected;
  return {
    id: project.id,
    reference: project.reference,
    kind: project.kind,
    title: project.title,
    status: project.status,
    paid: isPaid(project),
    paidAt: project.paid_at,
    createdAt: project.created_at,
    packageId: project.package_id,
    package: project.package_snapshot,
    inputs,
    hasOriginal: Boolean(project.original_path),
    selectedConcept: selected,
    images: ((images || []) as ImageRow[]).map((image) => ({
      index: image.concept_index,
      status:
        image.status === 'generating' && Date.now() - new Date(image.updated_at).getTime() > GENERATING_TIMEOUT_MS ? 'failed' : image.status,
      error: image.error,
    })),
    pdf: {
      ready: Boolean(project.pdf_path),
      level: project.pdf_level,
      generatedAt: project.pdf_generated_at,
    },
  };
}

function makeReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return `CGS-GD-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}

/* ------------------------------ handlers --------------------------------- */

async function handlePackages(res: ApiResponse) {
  const { data, error } = await supabaseAdmin.from('designer_packages').select('*').eq('active', true).order('sort_order');
  if (error) throw error;
  sendJson(res, 200, {
    packages: ((data || []) as PackageRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      pricePence: row.price_pence,
      description: row.description,
      features: row.features,
      concepts: row.concepts,
      pdfLevel: row.pdf_level,
      recommended: row.recommended,
    })),
  });
}

async function handleUploadUrl(req: ApiRequest, res: ApiResponse) {
  const body = getBody<{ filename?: unknown; contentType?: unknown }>(req);
  const contentType = str(body.contentType, 40);
  if (!IMAGE_TYPES.has(contentType)) throw new HttpError(400, 'Only JPEG, PNG and WebP photographs are allowed');
  const ownerId = await ensureOwner(req, res);
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const path = `owner/${ownerId}/originals/${Date.now()}-${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  sendJson(res, 200, { path: data.path, token: data.token });
}

async function handleCreate(req: ApiRequest, res: ApiResponse) {
  const body = getBody<Record<string, unknown>>(req);
  const kind = body.kind === 'redesign' || body.kind === 'scratch' ? body.kind : null;
  if (!kind) throw new HttpError(400, 'Unknown project type');
  const pack = await loadPackage(body.packageId);
  const ownerId = await ensureOwner(req, res);

  const { count } = await supabaseAdmin.from('designer_projects').select('id', { count: 'exact', head: true }).eq('owner_id', ownerId);
  if ((count || 0) >= MAX_PROJECTS_PER_OWNER) throw new HttpError(429, 'Project limit reached. Please contact us to continue.');

  let inputs: RedesignInputs | ScratchInputs;
  let originalPath: string | null = null;
  if (kind === 'redesign') {
    inputs = sanitizeRedesign(body.inputs);
    originalPath = str(body.originalPath, 300);
    if (!originalPath.startsWith(`owner/${ownerId}/originals/`) || originalPath.includes('..')) {
      throw new HttpError(400, 'Please upload a photograph of your garden');
    }
  } else {
    inputs = sanitizeScratch(body.inputs);
  }

  const title =
    str(body.title, 120) ||
    (kind === 'scratch' ? `${(inputs as ScratchInputs).plot.width} m x ${(inputs as ScratchInputs).plot.depth} m garden plan` : 'Garden redesign');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('designer_projects')
      .insert({
        reference: makeReference(),
        owner_id: ownerId,
        kind,
        package_id: pack.id,
        package_snapshot: { name: pack.name, pricePence: pack.price_pence, concepts: pack.concepts, pdfLevel: pack.pdf_level },
        title,
        inputs,
        original_path: originalPath,
      })
      .select('*')
      .single();
    if (!error && data) {
      sendJson(res, 200, { project: await projectView(data as ProjectRow) });
      return;
    }
    if (error && error.code !== '23505') throw error;
  }
  throw new HttpError(500, 'Could not create the project. Please try again.');
}

async function handleUpdate(req: ApiRequest, res: ApiResponse) {
  const body = getBody<Record<string, unknown>>(req);
  const project = await loadOwnedProject(req, body.projectId);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.selectedConcept !== undefined) {
    const index = Math.round(num(body.selectedConcept, 1, 6, 1));
    patch.inputs = { ...project.inputs, _selected: index };
    // A different selected design means any earlier PDF is out of date.
    patch.pdf_path = null;
    patch.pdf_generated_at = null;
    patch.pdf_level = null;
  } else {
    if (isPaid(project)) throw new HttpError(409, 'This project has already been paid for and can no longer be edited');
    if (body.packageId !== undefined) {
      const pack = await loadPackage(body.packageId);
      patch.package_id = pack.id;
      patch.package_snapshot = { name: pack.name, pricePence: pack.price_pence, concepts: pack.concepts, pdfLevel: pack.pdf_level };
    }
    if (body.inputs !== undefined) {
      patch.inputs = project.kind === 'scratch' ? sanitizeScratch(body.inputs) : sanitizeRedesign(body.inputs);
    }
    if (body.title !== undefined) patch.title = str(body.title, 120) || project.title;
  }

  const { data, error } = await supabaseAdmin.from('designer_projects').update(patch).eq('id', project.id).select('*').single();
  if (error) throw error;
  sendJson(res, 200, { project: await projectView(data as ProjectRow) });
}

async function handleProject(req: ApiRequest, res: ApiResponse) {
  const project = await loadOwnedProject(req, getQueryString(req.query.id));
  sendJson(res, 200, { project: await projectView(project) });
}

async function handleProjects(req: ApiRequest, res: ApiResponse) {
  const ownerId = requireOwner(req);
  const { data, error } = await supabaseAdmin
    .from('designer_projects')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const projects = await Promise.all(((data || []) as ProjectRow[]).map((row) => projectView(row)));
  sendJson(res, 200, { projects });
}

async function handleCheckout(req: ApiRequest, res: ApiResponse) {
  const body = getBody<{ projectId?: unknown; email?: unknown }>(req);
  const project = await loadOwnedProject(req, body.projectId);
  if (isPaid(project)) throw new HttpError(409, 'This project is already paid for');
  const pack = await loadPackage(project.package_id);
  if (pack.price_pence < 30) throw new HttpError(400, 'This package cannot be purchased online');

  const email = str(body.email, 200).toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  const base = origin(req);
  const orderToken = randomUUID();
  const session = await createCheckoutSession({
    projectId: project.id,
    reference: project.reference,
    packageName: pack.name,
    amountPence: pack.price_pence,
    successUrl: `${base}/ai-garden-designer/project/${project.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/ai-garden-designer/project/${project.id}?cancelled=1`,
    email: validEmail,
    idempotencyKey: `cgs-${project.id}-${orderToken}`,
  });
  if (!session.url) throw new HttpError(502, 'The payment provider did not return a checkout page');

  const { error: orderError } = await supabaseAdmin.from('designer_orders').insert({
    project_id: project.id,
    stripe_session_id: session.id,
    amount_pence: pack.price_pence,
    currency: 'gbp',
    package_id: pack.id,
    customer_email: validEmail,
  });
  if (orderError) throw orderError;

  await supabaseAdmin
    .from('designer_projects')
    .update({
      status: 'awaiting_payment',
      package_snapshot: { name: pack.name, pricePence: pack.price_pence, concepts: pack.concepts, pdfLevel: pack.pdf_level },
      updated_at: new Date().toISOString(),
    })
    .eq('id', project.id);

  sendJson(res, 200, { url: session.url });
}

/** Verifies a Stripe session server-side and marks the order paid exactly once. */
async function settleSession(session: StripeSession) {
  const { data: order, error } = await supabaseAdmin.from('designer_orders').select('*').eq('stripe_session_id', session.id).maybeSingle();
  if (error) throw error;
  if (!order) throw new HttpError(404, 'Unknown checkout session');
  if (order.status === 'paid') return order.project_id as string;

  const verified =
    session.status === 'complete' &&
    session.payment_status === 'paid' &&
    session.currency === 'gbp' &&
    session.amount_total === order.amount_pence &&
    session.client_reference_id === order.project_id &&
    session.metadata?.project_id === order.project_id;
  if (!verified) return null;

  const email = session.customer_details?.email?.toLowerCase() || order.customer_email || null;
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('designer_orders')
    .update({ status: 'paid', paid_at: now, payment_intent: session.payment_intent, customer_email: email })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id');
  if (updateError) {
    // Unique index: a different order for this project is already paid.
    console.error(`Duplicate payment for project ${order.project_id}, session ${session.id}: manual refund required`, updateError.message);
    return order.project_id as string;
  }
  if (updated && updated.length) {
    await supabaseAdmin
      .from('designer_projects')
      .update({ status: 'paid', paid_at: now, customer_email: email, updated_at: now })
      .eq('id', order.project_id)
      .in('status', ['draft', 'awaiting_payment']);
  }
  return order.project_id as string;
}

async function handleVerify(req: ApiRequest, res: ApiResponse) {
  const body = getBody<{ projectId?: unknown; sessionId?: unknown }>(req);
  const project = await loadOwnedProject(req, body.projectId);
  if (!isPaid(project)) {
    const session = await retrieveCheckoutSession(str(body.sessionId, 200));
    if (session.client_reference_id !== project.id) throw new HttpError(403, 'This payment does not belong to this project');
    await settleSession(session);
  }
  const fresh = await loadOwnedProject(req, project.id);
  sendJson(res, 200, { project: await projectView(fresh) });
}

async function handleWebhook(req: ApiRequest, res: ApiResponse) {
  // The event body is never trusted: only the session id is read, then the
  // session is re-fetched from Stripe and verified before anything is marked paid.
  const body = getBody<{ type?: unknown; data?: { object?: { id?: unknown } } }>(req);
  const id = body.data?.object?.id;
  if ((body.type === 'checkout.session.completed' || body.type === 'checkout.session.async_payment_succeeded') && typeof id === 'string') {
    try {
      await settleSession(await retrieveCheckoutSession(id));
    } catch (error) {
      if (!(error instanceof HttpError && error.status === 404)) throw error;
    }
  }
  sendJson(res, 200, { received: true });
}

async function download(path: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  if (error || !data) throw new HttpError(500, 'Could not read a saved file');
  return new Uint8Array(await data.arrayBuffer());
}

async function handleGenerate(req: ApiRequest, res: ApiResponse) {
  const body = getBody<{ projectId?: unknown; conceptIndex?: unknown }>(req);
  const project = await loadOwnedProject(req, body.projectId);
  if (!isPaid(project)) throw new HttpError(402, 'Payment is required before a design can be generated');
  const index = Math.round(num(body.conceptIndex, 1, 6, 1));
  if (index > project.package_snapshot.concepts) throw new HttpError(400, 'Your package does not include this many concepts');

  const { data: existing } = await supabaseAdmin
    .from('designer_images')
    .select('*')
    .eq('project_id', project.id)
    .eq('concept_index', index)
    .maybeSingle();
  const row = existing as ImageRow | null;
  if (row?.status === 'ready') {
    sendJson(res, 200, { project: await projectView(project) });
    return;
  }
  if (row?.status === 'generating' && Date.now() - new Date(row.updated_at).getTime() < GENERATING_TIMEOUT_MS) {
    throw new HttpError(409, 'This design is already being generated');
  }

  const now = new Date().toISOString();
  const claimed = row
    ? await supabaseAdmin
        .from('designer_images')
        .update({ status: 'generating', error: null, updated_at: now })
        .eq('id', row.id)
        .eq('updated_at', row.updated_at)
        .select('id')
    : await supabaseAdmin
        .from('designer_images')
        .insert({ project_id: project.id, concept_index: index, status: 'generating' })
        .select('id');
  if (claimed.error || !claimed.data?.length) throw new HttpError(409, 'This design is already being generated');
  const imageId = claimed.data[0].id as string;

  try {
    let bytes: Uint8Array;
    let prompt: string;
    if (project.kind === 'redesign') {
      if (!project.original_path) throw new HttpError(400, 'No garden photograph was uploaded');
      const photo = await download(project.original_path);
      const contentType = project.original_path.endsWith('.png') ? 'image/png' : project.original_path.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      prompt = buildRedesignPrompt(project.inputs as unknown as RedesignInputs, index);
      bytes = await generateFromPhoto({ bytes: photo, contentType }, prompt);
    } else {
      prompt = buildScratchPrompt(project.inputs as unknown as ScratchInputs, index);
      bytes = await generateFromText(prompt);
    }
    const path = `owner/${project.owner_id}/${project.id}/concept-${index}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) throw uploadError;
    await supabaseAdmin
      .from('designer_images')
      .update({ status: 'ready', path, prompt, error: null, updated_at: new Date().toISOString() })
      .eq('id', imageId);
    // Any earlier PDF no longer reflects the saved designs.
    await supabaseAdmin
      .from('designer_projects')
      .update({ pdf_path: null, pdf_generated_at: null, pdf_level: null, updated_at: new Date().toISOString() })
      .eq('id', project.id);
  } catch (error) {
    const message = error instanceof HttpError ? error.message : 'The design could not be generated. Please try again; you will not be charged again.';
    await supabaseAdmin
      .from('designer_images')
      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })
      .eq('id', imageId);
    throw error instanceof HttpError ? error : new HttpError(502, message);
  }

  const fresh = await loadOwnedProject(req, project.id);
  sendJson(res, 200, { project: await projectView(fresh) });
}

async function fetchLogo(req: ApiRequest) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${origin(req)}${LOGO_PATH}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function handlePdf(req: ApiRequest, res: ApiResponse) {
  const body = getBody<{ projectId?: unknown }>(req);
  const project = await loadOwnedProject(req, body.projectId);
  if (!isPaid(project)) throw new HttpError(402, 'Payment is required before a PDF can be generated');
  const level = project.package_snapshot.pdfLevel;
  if (project.kind === 'redesign' && project.package_id === 'preview') {
    throw new HttpError(400, 'The Garden Preview package includes the generated design download only');
  }
  if (level < 1) throw new HttpError(400, 'Your package does not include a PDF');

  const { data: images } = await supabaseAdmin.from('designer_images').select('*').eq('project_id', project.id).eq('status', 'ready').order('concept_index');
  const ready = (images || []) as ImageRow[];
  if (!ready.length) throw new HttpError(400, 'Generate your design before creating the PDF');

  const selected = Number(project.inputs._selected) || ready[0].concept_index;
  const ordered = [...ready].sort((a, b) => (a.concept_index === selected ? -1 : b.concept_index === selected ? 1 : a.concept_index - b.concept_index));
  const concepts: PdfImage[] = [];
  for (const image of ordered) {
    concepts.push({ bytes: await download(image.path as string), label: image.concept_index === selected ? `Concept ${image.concept_index} (selected)` : `Concept ${image.concept_index}` });
  }

  const inputs = { ...project.inputs };
  delete inputs._selected;
  const scratch = project.kind === 'scratch' ? (inputs as unknown as ScratchInputs) : undefined;
  const plan = scratch ? computePlan(scratch, await loadRates()) : undefined;

  const pdfBytes = await buildPdf({
    kind: project.kind,
    packageId: project.package_id,
    packageName: project.package_snapshot.name,
    pdfLevel: level >= 2 ? 2 : 1,
    reference: project.reference,
    title: project.title,
    generatedAt: new Date(),
    scratch,
    redesign: project.kind === 'redesign' ? (inputs as unknown as RedesignInputs) : undefined,
    plan,
    concepts,
    original: project.original_path ? { bytes: await download(project.original_path), label: 'Original photograph' } : undefined,
    logo: await fetchLogo(req),
  });

  const path = `owner/${project.owner_id}/${project.id}/garden-plan-${project.reference}.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (uploadError) throw uploadError;
  const { data, error } = await supabaseAdmin
    .from('designer_projects')
    .update({ pdf_path: path, pdf_level: level, pdf_generated_at: new Date().toISOString(), status: 'complete', updated_at: new Date().toISOString() })
    .eq('id', project.id)
    .select('*')
    .single();
  if (error) throw error;
  sendJson(res, 200, { project: await projectView(data as ProjectRow) });
}

async function handleFile(req: ApiRequest, res: ApiResponse) {
  const project = await loadOwnedProject(req, getQueryString(req.query.id));
  const kind = getQueryString(req.query.kind);
  const wantsDownload = getQueryString(req.query.dl) === '1';
  let path: string | null = null;
  let filename = 'file';

  if (kind === 'original') {
    path = project.original_path;
    filename = `${project.reference}-original.${(path || '').split('.').pop() || 'jpg'}`;
  } else if (kind === 'pdf') {
    path = project.pdf_path;
    filename = `Garden-Plan-${project.reference}.pdf`;
  } else if (kind === 'concept') {
    if (!isPaid(project)) throw new HttpError(402, 'Payment is required');
    const index = Math.round(num(getQueryString(req.query.index), 1, 6, 1));
    const { data } = await supabaseAdmin
      .from('designer_images')
      .select('path')
      .eq('project_id', project.id)
      .eq('concept_index', index)
      .eq('status', 'ready')
      .maybeSingle();
    path = data?.path || null;
    filename = `${project.reference}-concept-${index}.jpg`;
  }
  if (!path) throw new HttpError(404, 'File not found');
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 120, wantsDownload ? { download: filename } : undefined);
  if (error || !data) throw new HttpError(404, 'File not found');
  res.setHeader('Location', data.signedUrl);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(302).end();
}

const recoverCooldown = new Map<string, number>();

async function handleRecoverRequest(req: ApiRequest, res: ApiResponse) {
  const body = getBody<{ email?: unknown }>(req);
  const email = str(body.email, 200).toLowerCase();
  const generic = { ok: true, message: 'If we found purchases for that email address, we have sent a link to restore access.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Please enter a valid email address');
  const last = recoverCooldown.get(email) || 0;
  if (Date.now() - last < 60_000) {
    sendJson(res, 200, generic);
    return;
  }
  recoverCooldown.set(email, Date.now());

  const { count } = await supabaseAdmin
    .from('designer_projects')
    .select('id', { count: 'exact', head: true })
    .ilike('customer_email', email)
    .in('status', ['paid', 'complete']);
  if (count && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const expires = Math.floor(Date.now() / 1000) + 60 * 60;
    const payload = `${Buffer.from(email).toString('base64url')}.${expires}`;
    const link = `${origin(req)}/my-visualizations?recover=${encodeURIComponent(`${payload}.${sign(`recover:${payload}`)}`)}`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: 'Your Cambridge Garden Services designs',
        html: `<p>Use this link within one hour to open your saved garden designs on this device:</p><p><a href="${link}">Open My Visualizations</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
      }),
    }).catch((error) => console.error('Recovery email failed', error));
  }
  sendJson(res, 200, generic);
}

async function handleRecoverRedeem(req: ApiRequest, res: ApiResponse) {
  const body = getBody<{ token?: unknown }>(req);
  const token = str(body.token, 600);
  const [emailPart, expiresPart, signature] = token.split('.');
  const payload = `${emailPart}.${expiresPart}`;
  if (!emailPart || !expiresPart || !signature || !safeEqual(signature, sign(`recover:${payload}`)) || Number(expiresPart) < Date.now() / 1000) {
    throw new HttpError(400, 'This link is invalid or has expired. Please request a new one.');
  }
  const email = Buffer.from(emailPart, 'base64url').toString('utf8');
  const ownerId = await ensureOwner(req, res);
  setOwnerCookie(res, ownerId);
  const { error } = await supabaseAdmin
    .from('designer_projects')
    .update({ owner_id: ownerId })
    .ilike('customer_email', email)
    .in('status', ['paid', 'complete']);
  if (error) throw error;
  sendJson(res, 200, { ok: true });
}

async function handleAdmin(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  const resource = getQueryString(req.query.resource) || 'packages';
  if (resource === 'packages') {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('designer_packages').select('*').order('sort_order');
      if (error) throw error;
      sendJson(res, 200, { packages: data });
      return;
    }
    const body = getBody<Record<string, unknown>>(req);
    const id = str(body.id, 20);
    const price = Math.round(num(body.pricePence, 0, 1_000_000, -1));
    if (!['preview', 'plus', 'complete'].includes(id) || price < 0) throw new HttpError(400, 'Valid package and price are required');
    const features = (Array.isArray(body.features) ? body.features : []).map((item) => str(item, 300)).filter(Boolean).slice(0, 20);
    const name = str(body.name, 80);
    if (!name) throw new HttpError(400, 'Package name is required');
    if (body.recommended === true) await supabaseAdmin.from('designer_packages').update({ recommended: false }).neq('id', id);
    const { data, error } = await supabaseAdmin
      .from('designer_packages')
      .update({
        name,
        price_pence: price,
        description: str(body.description, 500),
        features,
        recommended: body.recommended === true,
        active: body.active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    sendJson(res, 200, { package: data });
    return;
  }
  if (resource === 'rates') {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('designer_rates').select('*').order('sort_order');
      if (error) throw error;
      sendJson(res, 200, { rates: data });
      return;
    }
    const body = getBody<Record<string, unknown>>(req);
    const key = str(body.key, 60);
    const rate = body.ratePence === null || body.ratePence === '' || body.ratePence === undefined ? null : Math.round(num(body.ratePence, 0, 100_000_000, 0));
    const { data, error } = await supabaseAdmin
      .from('designer_rates')
      .update({ rate_pence: rate, note: str(body.note, 300), updated_at: new Date().toISOString() })
      .eq('key', key)
      .select('*')
      .single();
    if (error) throw error;
    sendJson(res, 200, { rate: data });
    return;
  }
  if (resource === 'orders') {
    const { data, error } = await supabaseAdmin
      .from('designer_orders')
      .select('id, status, amount_pence, currency, package_id, customer_email, created_at, paid_at, designer_projects(reference, kind, title)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    sendJson(res, 200, { orders: data });
    return;
  }
  throw new HttpError(404, 'Unknown resource');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertSupabaseEnv();
    const name = getQueryString(req.query.__handler) || '';
    if (name === 'webhook') {
      assertMethod(req, ['POST']);
      await handleWebhook(req, res);
      return;
    }
    if (name === 'admin') {
      assertMethod(req, ['GET', 'PATCH']);
      if (req.method !== 'GET') assertSameOrigin(req);
      await handleAdmin(req, res);
      return;
    }

    const readOnly: Record<string, (req: ApiRequest, res: ApiResponse) => Promise<void> | void> = {
      packages: (_req, response) => handlePackages(response),
      project: handleProject,
      projects: handleProjects,
      file: handleFile,
    };
    const writers: Record<string, (req: ApiRequest, res: ApiResponse) => Promise<void>> = {
      'upload-url': handleUploadUrl,
      create: handleCreate,
      update: handleUpdate,
      checkout: handleCheckout,
      verify: handleVerify,
      generate: handleGenerate,
      pdf: handlePdf,
      'recover-request': handleRecoverRequest,
      'recover-redeem': handleRecoverRedeem,
    };

    if (readOnly[name]) {
      assertMethod(req, ['GET']);
      await readOnly[name](req, res);
      return;
    }
    if (writers[name]) {
      assertMethod(req, ['POST']);
      assertSameOrigin(req);
      await writers[name](req, res);
      return;
    }
    throw new HttpError(404, 'Unknown request');
  } catch (error) {
    sendError(res, error);
  }
}
