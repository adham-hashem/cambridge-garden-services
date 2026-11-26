import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import DesignerShell from '@/components/designer/DesignerShell';
import PackageCards, { usePackages } from '@/components/designer/PackageCards';
import PlotPreview from '@/components/designer/PlotPreview';
import { createProject, safeStorage, startCheckout, updateProject } from '@/lib/designer/api';
import {
  ELEMENT_TYPES,
  FEATURES,
  GARDEN_STYLES,
  LAWN_TYPES,
  MAINTENANCE_OPTIONS,
  MATERIAL_OPTIONS,
  PLANTS,
  PLANT_CATEGORIES,
  PLOT_PRESETS,
  clampElement,
  computePlan,
  placeElement,
  elementMeta,
  formatGbp,
  styleById,
  type GardenStyle,
  type HouseSide,
  type LayoutElement,
  type PackageId,
  type ScratchInputs,
} from '@/lib/designer/shared';

const STEPS = ['Plot', 'Layout', 'Style', 'Plants', 'Preferences', 'Review'];
const DRAFT_KEY = 'cgs_designer_scratch_v1';

const initialInputs: ScratchInputs = {
  plot: { width: 8, depth: 15, houseSide: 'top' },
  elements: [],
  style: 'traditional',
  plants: [],
  treeCounts: {},
  lawnType: 'turf',
  features: [],
  featureQty: {},
  preferences: { maintenance: 'medium', materials: [], budget: null, instructions: '', special: '' },
};

type Draft = { inputs: ScratchInputs; step: number; packageId: PackageId | null; projectId: string | null; email: string };

function loadDraft(): Draft | null {
  try {
    const raw = safeStorage()?.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

const field = 'w-full rounded-lg border border-sage-300 bg-white px-4 py-2.5 text-forest-800 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600';
const card = 'rounded-2xl border border-sage-200 bg-white p-6 shadow-sm';

function Stepper({ value, onChange, min = 1, max = 10, label }: { value: number; onChange: (value: number) => void; min?: number; max?: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sage-300 bg-white" role="group" aria-label={label}>
      <button type="button" aria-label={`Fewer ${label}`} className="p-1.5 text-forest-700 disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm tabular-nums">{value}</span>
      <button type="button" aria-label={`More ${label}`} className="p-1.5 text-forest-700 disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={14} />
      </button>
    </span>
  );
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

export default function ScratchWizard() {
  const [params] = useSearchParams();
  const initial = useMemo(loadDraft, []);
  const [inputs, setInputs] = useState<ScratchInputs>(initial?.inputs || initialInputs);
  const [step, setStep] = useState(initial?.step || 1);
  const [packageId, setPackageId] = useState<PackageId | null>((params.get('package') as PackageId | null) || initial?.packageId || null);
  const [projectId, setProjectId] = useState<string | null>(initial?.projectId || null);
  const [email, setEmail] = useState(initial?.email || '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { packages } = usePackages();
  const wizardRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // After every step change, once the new step has rendered, bring the top of the
  // wizard (heading, progress bar and the start of the step) into view below the fixed header.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // 'instant' overrides the site-wide smooth scrolling, which can be cancelled when the
    // page height changes between steps. A second pass corrects any late layout shift.
    const jump = () => wizardRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    const frame = window.requestAnimationFrame(() => {
      jump();
      headingRef.current?.focus({ preventScroll: true });
    });
    const settle = window.setTimeout(() => {
      const top = wizardRef.current?.getBoundingClientRect().top ?? 0;
      if (Math.abs(top - 80) > 8) jump();
    }, 150);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [step]);

  useEffect(() => {
    try {
      safeStorage()?.setItem(DRAFT_KEY, JSON.stringify({ inputs, step, packageId, projectId, email } satisfies Draft));
    } catch {
      /* storage unavailable: the wizard still works without a saved draft */
    }
  }, [inputs, step, packageId, projectId, email]);

  const plan = useMemo(() => computePlan(inputs, {}), [inputs]);
  const selectedPackage = packages?.find((item) => item.id === packageId) || null;
  const { plot } = inputs;

  const patch = (changes: Partial<ScratchInputs>) => setInputs((current) => ({ ...current, ...changes }));
  const patchPlot = (changes: Partial<ScratchInputs['plot']>) =>
    setInputs((current) => {
      const nextPlot = { ...current.plot, ...changes };
      return { ...current, plot: nextPlot, elements: current.elements.map((element) => clampElement(element, nextPlot)) };
    });

  const stepError = (() => {
    if (step === 1 && (!(plot.width >= 2 && plot.width <= 100) || !(plot.depth >= 2 && plot.depth <= 100))) {
      return 'Enter a width and depth between 2 m and 100 m.';
    }
    if (step === 2 && inputs.elements.length === 0) return 'Add at least one garden element to your layout.';
    return null;
  })();

  const goNext = () => {
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setStep((current) => Math.min(6, current + 1));
  };

  const goTo = (target: number) => {
    setError(null);
    setStep(target);
  };

  const addElement = (type: ScratchInputs['elements'][number]['type']) => {
    const id = `el-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const element = placeElement(type, plot, id, inputs.elements);
    patch({ elements: [...inputs.elements, element] });
    setSelectedId(id);
    setError(null);
  };

  const selected = inputs.elements.find((element) => element.id === selectedId) || null;
  const updateSelected = (changes: Partial<LayoutElement>) => {
    if (!selected) return;
    patch({ elements: inputs.elements.map((element) => (element.id === selected.id ? clampElement({ ...element, ...changes }, plot) : element)) });
  };

  const pay = async () => {
    if (!packageId) {
      setError('Choose a package to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let id = projectId;
      if (id) {
        await updateProject({ projectId: id, packageId, inputs });
      } else {
        const project = await createProject({ kind: 'scratch', packageId, inputs });
        id = project.id;
        setProjectId(id);
      }
      const url = await startCheckout(id, email.trim());
      window.location.assign(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      // A paid project cannot be edited: start fresh next time.
      if (message.includes('already been paid')) setProjectId(null);
      setError(message);
      setBusy(false);
    }
  };

  const summaryRow = (label: string, value: string, editStep: number) => (
    <div className="flex items-start justify-between gap-4 border-b border-sage-100 py-3 last:border-0">
      <div>
        <p className="text-xs uppercase tracking-wider text-sage-600">{label}</p>
        <p className="mt-0.5 text-forest-800">{value || 'None'}</p>
      </div>
      <button type="button" onClick={() => goTo(editStep)} className="shrink-0 text-sm text-forest-600 underline underline-offset-4 hover:text-forest-800">
        Edit
      </button>
    </div>
  );

  return (
    <DesignerShell
      title="Plan My Garden From Scratch | Cambridge Garden Services"
      description="Plan a new garden layout from your plot dimensions with a six-step planner and receive a downloadable garden plan PDF."
      path="/ai-garden-designer/plan"
    >
      <section ref={wizardRef} className="mx-auto max-w-6xl scroll-mt-20 px-6 py-10 lg:px-10">
        <h1 ref={headingRef} tabIndex={-1} className="font-serif text-4xl text-forest-800 focus:outline-none">
          Plan my garden from scratch
        </h1>

        <ol className="mt-8 grid grid-cols-6 gap-2" aria-label="Progress">
          {STEPS.map((label, index) => {
            const number = index + 1;
            const state = number < step ? 'done' : number === step ? 'current' : 'todo';
            return (
              <li key={label} aria-current={state === 'current' ? 'step' : undefined}>
                <button
                  type="button"
                  disabled={number > step}
                  onClick={() => goTo(number)}
                  className="block w-full text-left disabled:cursor-default"
                >
                  <span className={`block h-1.5 rounded-full ${state === 'todo' ? 'bg-sage-200' : 'bg-forest-700'}`} />
                  <span className={`mt-2 hidden text-xs sm:block ${state === 'current' ? 'font-semibold text-forest-800' : 'text-forest-500'}`}>
                    {number}/6 {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm font-medium text-forest-700 sm:hidden">
          Step {step}/6: {STEPS[step - 1]}
        </p>

        <div className="mt-8">
          {step === 1 && (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className={card}>
                <h2 className="font-serif text-2xl text-forest-800">Step 1: Plot dimensions</h2>
                <p className="mt-1 text-sm text-forest-600">Measure the garden area behind or beside your house, in metres.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {PLOT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => patchPlot({ width: preset.width, depth: preset.depth })}
                      className={`rounded-full border px-4 py-1.5 text-sm ${
                        plot.width === preset.width && plot.depth === preset.depth ? 'border-forest-700 bg-forest-700 text-cream-100' : 'border-sage-300 text-forest-700 hover:bg-sage-100'
                      }`}
                    >
                      {preset.label} ({preset.width} x {preset.depth} m)
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <label className="text-sm text-forest-700">
                    Width (m)
                    <input type="number" inputMode="decimal" min={2} max={100} step={0.5} className={`${field} mt-1`} value={plot.width || ''} onChange={(e) => patchPlot({ width: Number(e.target.value) })} />
                  </label>
                  <label className="text-sm text-forest-700">
                    Depth (m)
                    <input type="number" inputMode="decimal" min={2} max={100} step={0.5} className={`${field} mt-1`} value={plot.depth || ''} onChange={(e) => patchPlot({ depth: Number(e.target.value) })} />
                  </label>
                </div>
                <fieldset className="mt-6">
                  <legend className="text-sm text-forest-700">Where is your house on the plan? The street is on the other side of it.</legend>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {(['top', 'right', 'bottom', 'left'] as HouseSide[]).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => patchPlot({ houseSide: side })}
                        className={`rounded-lg border px-3 py-2 text-sm capitalize ${plot.houseSide === side ? 'border-forest-700 bg-forest-700 text-cream-100' : 'border-sage-300 text-forest-700 hover:bg-sage-100'}`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <p className="mt-6 text-sm text-forest-600">Plot area: {Math.round(plot.width * plot.depth * 10) / 10 || 0} m²</p>
              </div>
              <div className={card}>
                <PlotPreview plot={plot} elements={inputs.elements} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className={card}>
                <h2 className="font-serif text-2xl text-forest-800">Step 2: Garden layout</h2>
                <p className="mt-1 text-sm text-forest-600">Add elements, then drag to position them. Drag the dark handle on a selected element to resize.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ELEMENT_TYPES.map((meta) => (
                    <button
                      key={meta.type}
                      type="button"
                      onClick={() => addElement(meta.type)}
                      className="flex items-center gap-2 rounded-full border border-sage-300 px-3 py-1.5 text-sm text-forest-700 hover:bg-sage-100"
                    >
                      <span className="h-3 w-3 rounded-sm" style={{ background: meta.fill, border: `1px solid ${meta.stroke}` }} />
                      <Plus size={12} /> {meta.label}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <PlotPreview plot={plot} elements={inputs.elements} editable selectedId={selectedId} onSelect={setSelectedId} onChange={(elements) => patch({ elements })} />
                </div>
              </div>
              <div className="space-y-6">
                <div className={card}>
                  <h3 className="font-serif text-xl text-forest-800">Selected element</h3>
                  {selected ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm font-medium text-forest-700">{elementMeta(selected.type).label}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            ['x', 'Left (m)'],
                            ['y', 'Top (m)'],
                            ['w', 'Width (m)'],
                            ['h', 'Depth (m)'],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="text-xs text-forest-600">
                            {label}
                            <input
                              type="number"
                              step={0.1}
                              className={`${field} mt-1 py-1.5 text-sm`}
                              value={selected[key]}
                              onChange={(e) => updateSelected({ [key]: Number(e.target.value) })}
                            />
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-red-700 hover:underline"
                        onClick={() => {
                          patch({ elements: inputs.elements.filter((element) => element.id !== selected.id) });
                          setSelectedId(null);
                        }}
                      >
                        <Trash2 size={14} /> Remove element
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-forest-600">Select an element on the plan to edit its size and position.</p>
                  )}
                </div>
                <div className={card}>
                  <h3 className="font-serif text-xl text-forest-800">Areas</h3>
                  <ul className="mt-2 space-y-1 text-sm text-forest-700">
                    {ELEMENT_TYPES.filter((meta) => plan.areas[meta.type] > 0).map((meta) => (
                      <li key={meta.type} className="flex justify-between">
                        <span>{meta.label}</span>
                        <span>{plan.areas[meta.type]} m²</span>
                      </li>
                    ))}
                    {!inputs.elements.length && <li className="text-forest-500">Nothing placed yet.</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={card}>
              <h2 className="font-serif text-2xl text-forest-800">Step 3: Garden style</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GARDEN_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => patch({ style: style.id as GardenStyle })}
                    aria-pressed={inputs.style === style.id}
                    className={`rounded-xl border p-5 text-left transition ${inputs.style === style.id ? 'border-forest-700 bg-forest-50 ring-2 ring-forest-700' : 'border-sage-200 hover:border-sage-400'}`}
                  >
                    <span className="font-serif text-xl text-forest-800">{style.label}</span>
                    <span className="mt-1 block text-sm text-forest-600">{style.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className={card}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-2xl text-forest-800">Step 4: Plants and features</h2>
                  <button
                    type="button"
                    className="rounded-full border border-sage-300 px-4 py-1.5 text-sm text-forest-700 hover:bg-sage-100"
                    onClick={() => patch({ plants: Array.from(new Set([...inputs.plants, ...styleById(inputs.style).plants])) })}
                  >
                    Add suggestions for {styleById(inputs.style).label}
                  </button>
                </div>
                {PLANT_CATEGORIES.map((category) => (
                  <div key={category.id} className="mt-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-sage-700">{category.plural}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PLANTS.filter((plant) => plant.category === category.id).map((plant) => {
                        const on = inputs.plants.includes(plant.id);
                        return (
                          <span key={plant.id} className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              aria-pressed={on}
                              title={`${plant.latin}: ${plant.description}`}
                              onClick={() => patch({ plants: toggle(inputs.plants, plant.id) })}
                              className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-forest-700 bg-forest-700 text-cream-100' : 'border-sage-300 text-forest-700 hover:bg-sage-100'}`}
                            >
                              {plant.name}
                            </button>
                            {on && category.id === 'tree' && (
                              <Stepper
                                label={`${plant.name} trees`}
                                value={inputs.treeCounts[plant.id] || 1}
                                onChange={(value) => patch({ treeCounts: { ...inputs.treeCounts, [plant.id]: value } })}
                              />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={card}>
                <h3 className="font-serif text-xl text-forest-800">Lawn type</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {LAWN_TYPES.map((lawn) => (
                    <label key={lawn.id} className={`cursor-pointer rounded-xl border p-4 ${inputs.lawnType === lawn.id ? 'border-forest-700 bg-forest-50' : 'border-sage-200'}`}>
                      <input type="radio" name="lawn" className="sr-only" checked={inputs.lawnType === lawn.id} onChange={() => patch({ lawnType: lawn.id })} />
                      <span className="font-medium text-forest-800">{lawn.label}</span>
                      <span className="block text-sm text-forest-600">{lawn.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={card}>
                <h3 className="font-serif text-xl text-forest-800">Fencing, lighting, seating and decorative features</h3>
                {(['fencing', 'lighting', 'seating', 'decorative'] as const).map((category) => (
                  <div key={category} className="mt-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-sage-700">{category}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {FEATURES.filter((feature) => feature.category === category).map((feature) => {
                        const on = inputs.features.includes(feature.id);
                        return (
                          <span key={feature.id} className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              aria-pressed={on}
                              onClick={() => patch({ features: toggle(inputs.features, feature.id) })}
                              className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-forest-700 bg-forest-700 text-cream-100' : 'border-sage-300 text-forest-700 hover:bg-sage-100'}`}
                            >
                              {feature.label}
                            </button>
                            {on && feature.countable && (
                              <Stepper label={feature.label} value={inputs.featureQty[feature.id] || 1} onChange={(value) => patch({ featureQty: { ...inputs.featureQty, [feature.id]: value } })} />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className={`${card} space-y-6`}>
              <h2 className="font-serif text-2xl text-forest-800">Step 5: Preferences and budget</h2>
              <fieldset>
                <legend className="text-sm font-medium text-forest-700">Maintenance preference</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {MAINTENANCE_OPTIONS.map((option) => (
                    <label key={option.id} className={`cursor-pointer rounded-xl border p-4 ${inputs.preferences.maintenance === option.id ? 'border-forest-700 bg-forest-50' : 'border-sage-200'}`}>
                      <input type="radio" name="maintenance" className="sr-only" checked={inputs.preferences.maintenance === option.id} onChange={() => patch({ preferences: { ...inputs.preferences, maintenance: option.id } })} />
                      <span className="font-medium text-forest-800">{option.label}</span>
                      <span className="block text-sm text-forest-600">{option.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-forest-700">Preferred materials</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MATERIAL_OPTIONS.map((material) => {
                    const on = inputs.preferences.materials.includes(material);
                    return (
                      <button
                        key={material}
                        type="button"
                        aria-pressed={on}
                        onClick={() => patch({ preferences: { ...inputs.preferences, materials: toggle(inputs.preferences.materials, material) } })}
                        className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-forest-700 bg-forest-700 text-cream-100' : 'border-sage-300 text-forest-700 hover:bg-sage-100'}`}
                      >
                        {material}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="block text-sm font-medium text-forest-700">
                Project budget (£, optional)
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  className={`${field} mt-1 max-w-xs`}
                  value={inputs.preferences.budget ?? ''}
                  onChange={(e) => patch({ preferences: { ...inputs.preferences, budget: e.target.value === '' ? null : Number(e.target.value) } })}
                />
              </label>
              <label className="block text-sm font-medium text-forest-700">
                Additional instructions
                <textarea rows={3} maxLength={1500} className={`${field} mt-1`} value={inputs.preferences.instructions} onChange={(e) => patch({ preferences: { ...inputs.preferences, instructions: e.target.value } })} />
              </label>
              <label className="block text-sm font-medium text-forest-700">
                Special requirements (access, pets, children, accessibility)
                <textarea rows={2} maxLength={1000} className={`${field} mt-1`} value={inputs.preferences.special} onChange={(e) => patch({ preferences: { ...inputs.preferences, special: e.target.value } })} />
              </label>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className={card}>
                  <h2 className="font-serif text-2xl text-forest-800">Step 6: Review and generate</h2>
                  {summaryRow('Plot', `${plot.width} m x ${plot.depth} m (${Math.round(plot.width * plot.depth * 10) / 10} m²), house on the ${plot.houseSide} edge`, 1)}
                  {summaryRow(
                    'Layout',
                    ELEMENT_TYPES.filter((meta) => plan.areas[meta.type] > 0)
                      .map((meta) => `${meta.label} ${plan.areas[meta.type]} m²`)
                      .join(', '),
                    2
                  )}
                  {summaryRow('Style', styleById(inputs.style).label, 3)}
                  {summaryRow(
                    'Plants',
                    inputs.plants.map((id) => PLANTS.find((plant) => plant.id === id)?.name).filter(Boolean).join(', '),
                    4
                  )}
                  {summaryRow('Lawn', LAWN_TYPES.find((lawn) => lawn.id === inputs.lawnType)?.label || '', 4)}
                  {summaryRow(
                    'Features',
                    inputs.features.map((id) => FEATURES.find((feature) => feature.id === id)?.label).filter(Boolean).join(', '),
                    4
                  )}
                  {summaryRow('Maintenance', inputs.preferences.maintenance, 5)}
                  {summaryRow('Materials', inputs.preferences.materials.join(', '), 5)}
                  {summaryRow('Budget', inputs.preferences.budget ? formatGbp(Math.round(inputs.preferences.budget * 100)) : 'Not specified', 5)}
                  {summaryRow('Notes', [inputs.preferences.instructions, inputs.preferences.special].filter(Boolean).join(' | '), 5)}
                </div>
                <div className={card}>
                  <PlotPreview plot={plot} elements={inputs.elements} plan={plan} />
                  {plan.warnings.map((warning) => (
                    <p key={warning} className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-serif text-2xl text-forest-800">Choose your package</h3>
                <PackageCards selected={packageId} onSelect={setPackageId} actionLabel="Select" disabled={busy} />
              </div>

              <div className={`${card} flex flex-col gap-4 md:flex-row md:items-end md:justify-between`}>
                <div className="max-w-md flex-1">
                  <p className="text-sm text-forest-600">
                    Payment status: <strong className="text-forest-800">Not paid</strong>. Your design and PDF are generated only after your payment is confirmed.
                  </p>
                  <label className="mt-3 block text-sm font-medium text-forest-700">
                    Email (optional: receipt and restoring access on another device)
                    <input type="email" autoComplete="email" className={`${field} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={pay}
                  disabled={busy || !packageId}
                  className="flex items-center justify-center gap-2 rounded-full bg-forest-800 px-8 py-3.5 text-sm font-medium tracking-wide text-cream-100 transition hover:bg-forest-900 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  {selectedPackage ? `Pay ${formatGbp(selectedPackage.pricePence)} and generate my plan` : 'Choose a package'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => goTo(Math.max(1, step - 1))}
            disabled={step === 1 || busy}
            className="flex items-center gap-2 rounded-full border border-sage-300 px-6 py-2.5 text-sm text-forest-700 hover:bg-sage-100 disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < 6 && (
            <button type="button" onClick={goNext} className="flex items-center gap-2 rounded-full bg-forest-800 px-6 py-2.5 text-sm text-cream-100 hover:bg-forest-900">
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
    </DesignerShell>
  );
}
