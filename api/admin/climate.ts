import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { assertMethod, assertSameOrigin, getBody, getQueryString, pick, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase.js';

const CLIMATE_SECTION_ID = '00000000-0000-0000-0000-000000000001';

type ClimateSectionInput = {
  title: string;
  description: string;
  final_message: string;
  cta_label: string;
};

type ClimateOptionInput = {
  label: string;
  icon: string;
  image: string;
  image_alt: string;
  solution_title: string;
  solution_text: string;
  sort_order: number;
  enabled: boolean;
};

const sectionFields: (keyof ClimateSectionInput)[] = ['title', 'description', 'final_message', 'cta_label'];
const optionFields: (keyof ClimateOptionInput)[] = [
  'label',
  'icon',
  'image',
  'image_alt',
  'solution_title',
  'solution_text',
  'sort_order',
  'enabled',
];

async function fetchClimate() {
  const { data: section, error: sectionError } = await supabaseAdmin
    .from('climate_section')
    .select('*')
    .eq('id', CLIMATE_SECTION_ID)
    .maybeSingle();
  if (sectionError) throw sectionError;

  const { data: options, error: optionsError } = await supabaseAdmin
    .from('climate_options')
    .select('*')
    .eq('climate_id', CLIMATE_SECTION_ID)
    .order('sort_order', { ascending: true });
  if (optionsError) throw optionsError;

  return section ? { ...section, options: options || [] } : null;
}

function normalizeOption(input: Partial<ClimateOptionInput>, partial = false) {
  const output = pick<ClimateOptionInput>(input as Record<string, unknown>, optionFields);
  for (const field of ['label', 'icon', 'image', 'image_alt', 'solution_title', 'solution_text'] as const) {
    if (!partial && typeof output[field] !== 'string') throw new Error(`${field} is required`);
    if (typeof output[field] === 'string') output[field] = output[field].trim().slice(0, field === 'solution_text' ? 4000 : 1200);
  }
  if (output.sort_order !== undefined) output.sort_order = Number(output.sort_order) || 0;
  if (typeof output.enabled !== 'boolean') {
    if (!partial) output.enabled = true;
    else delete output.enabled;
  }
  return output;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['GET', 'POST', 'PATCH', 'DELETE']);
    if (req.method !== 'GET') assertSameOrigin(req);
    requireAdmin(req);
    assertSupabaseEnv();

    if (req.method === 'GET') {
      sendJson(res, 200, { climate: await fetchClimate() });
      return;
    }

    if (req.method === 'DELETE') {
      const id = getQueryString(req.query.id);
      if (!id) {
        sendJson(res, 400, { error: 'Climate option id is required' });
        return;
      }
      const { error } = await supabaseAdmin.from('climate_options').delete().eq('id', id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const body = getBody<{ id?: unknown; section?: Partial<ClimateSectionInput>; option?: Partial<ClimateOptionInput> }>(req);

    if (req.method === 'POST') {
      const option = normalizeOption(body.option || (body as Partial<ClimateOptionInput>));
      const { data, error } = await supabaseAdmin
        .from('climate_options')
        .insert({ ...option, climate_id: CLIMATE_SECTION_ID })
        .select('*')
        .single();
      if (error) throw error;
      sendJson(res, 201, { option: data });
      return;
    }

    if (body.section) {
      const section = pick<ClimateSectionInput>(body.section as Record<string, unknown>, sectionFields);
      const { error } = await supabaseAdmin.from('climate_section').update(section).eq('id', CLIMATE_SECTION_ID);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    if (typeof body.id !== 'string' || !body.id) {
      sendJson(res, 400, { error: 'Climate option id is required' });
      return;
    }

    const option = normalizeOption(body.option || (body as Partial<ClimateOptionInput>), true);
    const { data, error } = await supabaseAdmin
      .from('climate_options')
      .update(option)
      .eq('id', body.id)
      .select('*')
      .single();
    if (error) throw error;
    sendJson(res, 200, { option: data });
  } catch (error) {
    sendError(res, error);
  }
}
