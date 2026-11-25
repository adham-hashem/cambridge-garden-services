import { HttpError } from '../_lib/http.js';
import {
  describeLayout,
  featureById,
  plantById,
  styleById,
  type RedesignInputs,
  type ScratchInputs,
} from '../../src/lib/designer/shared.js';

const OPENAI_API = 'https://api.openai.com/v1';

/** Different design directions so each concept in a paid set is genuinely distinct. */
const DIRECTIONS = [
  'Design direction 1: a balanced composition that follows the chosen style most faithfully.',
  'Design direction 2: emphasise richer, layered planting and seasonal colour while keeping the same layout.',
  'Design direction 3: emphasise entertaining and relaxing, with refined hard landscaping, lighting and seating.',
];

function apiKey() {
  const value = process.env.OPENAI_API_KEY;
  if (!value) throw new HttpError(503, 'AI generation is not configured yet (OPENAI_API_KEY is missing)');
  return value;
}

function model() {
  return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
}

export function buildRedesignPrompt(inputs: RedesignInputs, conceptIndex: number) {
  const style = styleById(inputs.style);
  return [
    'Redesign the garden shown in this photograph as a realistic, photographic garden design visualisation.',
    'Keep the house, boundaries, camera angle and overall footprint of the garden recognisable; transform the garden itself.',
    `Target style: ${style.prompt}.`,
    inputs.instructions ? `Customer instructions: ${inputs.instructions}` : '',
    DIRECTIONS[(conceptIndex - 1) % DIRECTIONS.length],
    'English garden setting, natural daylight, realistic plants and materials, no text, no watermarks, no people.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildScratchPrompt(inputs: ScratchInputs, conceptIndex: number) {
  const style = styleById(inputs.style);
  const plants = inputs.plants.map(plantById).filter(Boolean).map((plant) => `${plant?.name} (${plant?.category})`);
  const features = inputs.features
    .map(featureById)
    .filter(Boolean)
    .map((feature) => feature?.label);
  return [
    `A realistic photographic visualisation of a newly designed garden: ${style.prompt}.`,
    'View from the back of the house looking into the garden, natural daylight, English setting.',
    describeLayout(inputs),
    plants.length ? `Planting: ${plants.join(', ')}.` : '',
    features.length ? `Features: ${features.join(', ')}.` : '',
    inputs.preferences.materials.length ? `Preferred materials: ${inputs.preferences.materials.join(', ')}.` : '',
    `Maintenance level: ${inputs.preferences.maintenance}.`,
    inputs.preferences.instructions ? `Customer notes: ${inputs.preferences.instructions}` : '',
    DIRECTIONS[(conceptIndex - 1) % DIRECTIONS.length],
    'Show the garden as a believable finished space. No text, no labels, no watermarks, no people.',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 3800);
}

async function parseImage(response: Response): Promise<Uint8Array> {
  const json = (await response.json().catch(() => ({}))) as { data?: { b64_json?: string }[]; error?: { message?: string; code?: string } };
  if (!response.ok) {
    console.error('OpenAI image error', response.status, json.error?.message);
    if (json.error?.code === 'moderation_blocked') {
      throw new HttpError(422, 'The image could not be generated for this request. Please adjust your instructions and try again.');
    }
    throw new HttpError(502, 'The AI service could not generate this design. Please try again; you will not be charged again.');
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new HttpError(502, 'The AI service returned no image. Please try again; you will not be charged again.');
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

export async function generateFromPhoto(photo: { bytes: Uint8Array; contentType: string }, prompt: string) {
  const form = new FormData();
  form.set('model', model());
  form.set('prompt', prompt);
  form.set('size', 'auto');
  form.set('quality', 'medium');
  form.set('output_format', 'jpeg');
  form.set('output_compression', '85');
  form.set('n', '1');
  const ext = photo.contentType === 'image/png' ? 'png' : photo.contentType === 'image/webp' ? 'webp' : 'jpg';
  form.set('image[]', new Blob([Buffer.from(photo.bytes)], { type: photo.contentType }), `garden.${ext}`);
  const response = await fetch(`${OPENAI_API}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  return parseImage(response);
}

export async function generateFromText(prompt: string) {
  const response = await fetch(`${OPENAI_API}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model(),
      prompt,
      size: '1536x1024',
      quality: 'medium',
      output_format: 'jpeg',
      output_compression: 85,
      n: 1,
    }),
  });
  return parseImage(response);
}
