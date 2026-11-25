import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CreditCard, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import DesignerShell from '@/components/designer/DesignerShell';
import GardenQuoteCta from '@/components/designer/GardenQuoteCta';
import PlotPreview from '@/components/designer/PlotPreview';
import { createPdf, fileUrl, generateConcept, getProject, safeStorage, startCheckout, updateProject, verifyPayment, type ProjectView } from '@/lib/designer/api';
import { computePlan, formatGbp, styleById, type ScratchInputs } from '@/lib/designer/shared';

const card = 'rounded-2xl border border-sage-200 bg-white p-6 shadow-sm';

export default function DesignerProject() {
  const { projectId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState<ProjectView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [email, setEmail] = useState('');
  const verifying = useRef(false);
  const generatingRef = useRef(false);
  const pdfRef = useRef(false);

  const sessionId = params.get('session_id');

  const load = useCallback(async () => {
    try {
      setProject(await getProject(projectId));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Project not found');
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Verify payment server-side when returning from checkout.
  useEffect(() => {
    if (!sessionId || verifying.current) return;
    verifying.current = true;
    verifyPayment(projectId, sessionId)
      .then((verified) => {
        setProject(verified);
        if (!verified.paid) setNotice('Your payment has not been confirmed yet. If you completed payment, wait a moment and refresh this page.');
      })
      .catch((err: Error) => setNotice(err.message))
      .finally(() => {
        const next = new URLSearchParams(params);
        next.delete('session_id');
        setParams(next, { replace: true });
      });
  }, [sessionId, projectId, params, setParams]);

  useEffect(() => {
    if (project?.paid) {
      try {
        safeStorage()?.removeItem('cgs_designer_scratch_v1');
      } catch {
        /* ignore */
      }
    }
  }, [project?.paid]);

  const totalConcepts = project?.package.concepts || 0;
  const readyIndexes = useMemo(() => new Set((project?.images || []).filter((image) => image.status === 'ready').map((image) => image.index)), [project?.images]);
  const missing = useMemo(() => Array.from({ length: totalConcepts }, (_, i) => i + 1).filter((index) => !readyIndexes.has(index)), [totalConcepts, readyIndexes]);

  const runGeneration = useCallback(async () => {
    if (!project || generatingRef.current) return;
    generatingRef.current = true;
    setGenError(null);
    try {
      for (const index of missing) {
        setGenerating(index);
        const updated = await generateConcept(project.id, index);
        setProject(updated);
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(null);
      generatingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, missing.join(',')]);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (project?.paid && missing.length && !autoStarted.current) {
      autoStarted.current = true;
      void runGeneration();
    }
  }, [project?.paid, missing.length, runGeneration]);

  const needsPdf = Boolean(project && project.paid && project.package.pdfLevel > 0 && !(project.kind === 'redesign' && project.packageId === 'preview'));

  const runPdf = useCallback(async () => {
    if (!project || pdfRef.current) return;
    pdfRef.current = true;
    setPdfBusy(true);
    setPdfError(null);
    try {
      setProject(await createPdf(project.id));
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'The PDF could not be created');
    } finally {
      setPdfBusy(false);
      pdfRef.current = false;
    }
  }, [project]);

  const pdfAutoTried = useRef<string>('');
  useEffect(() => {
    if (!project || !needsPdf || project.pdf.ready || missing.length || generating !== null || pdfBusy || pdfError) return;
    const key = `${project.id}:${project.selectedConcept}:${project.images.length}`;
    if (pdfAutoTried.current === key) return;
    pdfAutoTried.current = key;
    void runPdf();
  }, [project, needsPdf, missing.length, generating, pdfBusy, pdfError, runPdf]);

  const pay = async () => {
    if (!project) return;
    setPayBusy(true);
    try {
      window.location.assign(await startCheckout(project.id, email.trim()));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Payment could not be started');
      setPayBusy(false);
    }
  };

  const chooseConcept = async (index: number) => {
    if (!project || index === project.selectedConcept) return;
    try {
      pdfAutoTried.current = '';
      setProject(await updateProject({ projectId: project.id, selectedConcept: index }));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not select this design');
    }
  };

  if (loadError) {
    return (
      <DesignerShell title="Garden project | Cambridge Garden Services" description="Your AI garden design project." noIndex>
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <AlertTriangle className="mx-auto text-amber-600" />
          <h1 className="mt-4 font-serif text-3xl text-forest-800">We could not open this project</h1>
          <p className="mt-2 text-forest-600">{loadError}. Projects are private to the browser that created them.</p>
          <Link to="/my-visualizations" className="mt-6 inline-block rounded-full bg-forest-800 px-6 py-3 text-sm text-cream-100">
            Go to My Visualizations
          </Link>
        </div>
      </DesignerShell>
    );
  }

  if (!project) {
    return (
      <DesignerShell title="Garden project | Cambridge Garden Services" description="Your AI garden design project." noIndex>
        <div className="flex justify-center py-32">
          <Loader2 className="animate-spin text-forest-600" size={32} />
        </div>
      </DesignerShell>
    );
  }

  const scratch = project.kind === 'scratch' ? (project.inputs as unknown as ScratchInputs) : null;
  const plan = scratch ? computePlan(scratch, {}) : null;
  const style = styleById(String(project.inputs.style || 'modern'));
  const selected = project.selectedConcept;
  const allReady = project.paid && missing.length === 0;
  const cacheKey = project.images.map((image) => `${image.index}${image.status}`).join('');

  return (
    <DesignerShell title={`${project.title} | Cambridge Garden Services`} description="Your AI garden design project." noIndex>
      <section className="mx-auto max-w-6xl space-y-8 px-6 py-10 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-sage-600">
              {project.package.name} · Ref {project.reference}
            </p>
            <h1 className="mt-1 font-serif text-4xl text-forest-800">{project.title}</h1>
            <p className="mt-1 text-sm text-forest-600">
              {style.label} · created {new Date(project.createdAt).toLocaleDateString('en-GB')}
            </p>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-sm ${project.paid ? 'bg-forest-100 text-forest-800' : 'bg-amber-100 text-amber-800'}`}>
            {project.paid ? 'Payment confirmed' : 'Payment required'}
          </span>
        </header>

        {notice && (
          <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            {notice}
          </p>
        )}
        {params.get('cancelled') && !project.paid && <p className="rounded-lg bg-sage-100 p-4 text-sm text-forest-700">Payment was cancelled. You have not been charged.</p>}

        {!project.paid && (
          <div className={`${card} flex flex-col gap-4 md:flex-row md:items-end md:justify-between`}>
            <div>
              <h2 className="font-serif text-2xl text-forest-800">Complete your payment</h2>
              <p className="mt-1 text-sm text-forest-600">
                {project.package.name}: {formatGbp(project.package.pricePence)}. Your design is generated after payment is confirmed.
              </p>
              <label className="mt-3 block text-sm text-forest-700">
                Email (optional)
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-sage-300 px-4 py-2" />
              </label>
            </div>
            <button type="button" onClick={pay} disabled={payBusy} className="flex items-center gap-2 rounded-full bg-forest-800 px-8 py-3.5 text-sm text-cream-100 disabled:opacity-60">
              {payBusy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Pay {formatGbp(project.package.pricePence)}
            </button>
          </div>
        )}

        {project.paid && (
          <div className={card} aria-live="polite">
            {generating !== null ? (
              <p className="flex items-center gap-3 text-forest-700">
                <Loader2 className="animate-spin" size={18} /> Creating design {generating} of {totalConcepts}. This can take up to a minute. Please keep this page open.
              </p>
            ) : genError ? (
              <div className="space-y-3">
                <p className="flex items-start gap-2 text-red-700">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {genError}
                </p>
                <button type="button" onClick={() => void runGeneration()} className="flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 text-sm text-cream-100">
                  <RefreshCw size={14} /> Try again (no extra charge)
                </button>
              </div>
            ) : missing.length ? (
              <button type="button" onClick={() => void runGeneration()} className="flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 text-sm text-cream-100">
                <RefreshCw size={14} /> Generate remaining designs
              </button>
            ) : (
              <p className="flex items-center gap-2 text-forest-700">
                <CheckCircle2 size={18} className="text-sage-600" /> Your {totalConcepts > 1 ? 'designs are' : 'design is'} ready.
              </p>
            )}
          </div>
        )}

        {project.kind === 'redesign' && project.hasOriginal && readyIndexes.has(selected) && (
          <div className={card}>
            <h2 className="font-serif text-2xl text-forest-800">Before and after</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <figure>
                <img src={fileUrl(project.id, 'original')} alt="Your original garden" className="w-full rounded-xl object-cover" />
                <figcaption className="mt-2 text-center text-sm text-forest-600">Original</figcaption>
              </figure>
              <figure>
                <img src={fileUrl(project.id, 'concept', { index: selected, v: cacheKey })} alt="Your redesigned garden" className="w-full rounded-xl object-cover" />
                <figcaption className="mt-2 text-center text-sm text-forest-600">Redesigned: concept {selected}</figcaption>
              </figure>
            </div>
          </div>
        )}

        {project.paid && project.images.some((image) => image.status === 'ready') && (
          <div className={card}>
            <h2 className="font-serif text-2xl text-forest-800">{totalConcepts > 1 ? 'Design concepts' : 'Your garden design'}</h2>
            <div className={`mt-4 grid gap-5 ${totalConcepts > 1 ? 'md:grid-cols-3' : ''}`}>
              {project.images
                .filter((image) => image.status === 'ready')
                .map((image) => (
                  <figure key={image.index} className={`overflow-hidden rounded-xl border ${selected === image.index && totalConcepts > 1 ? 'border-forest-700 ring-2 ring-forest-700' : 'border-sage-200'}`}>
                    <img src={fileUrl(project.id, 'concept', { index: image.index, v: cacheKey })} alt={`Garden design concept ${image.index}`} className="aspect-[3/2] w-full object-cover" loading="lazy" />
                    <figcaption className="flex items-center justify-between gap-2 p-3 text-sm">
                      <span className="text-forest-700">Concept {image.index}</span>
                      <span className="flex gap-3">
                        {totalConcepts > 1 && (
                          <button type="button" className="text-forest-600 underline underline-offset-2" onClick={() => void chooseConcept(image.index)}>
                            {selected === image.index ? 'Selected' : 'Use this design'}
                          </button>
                        )}
                        <a className="flex items-center gap-1 text-forest-700 hover:underline" href={fileUrl(project.id, 'concept', { index: image.index, download: true })}>
                          <Download size={14} /> Download
                        </a>
                      </span>
                    </figcaption>
                  </figure>
                ))}
            </div>
            <p className="mt-3 text-xs text-forest-500">AI images illustrate the design direction and may differ from your exact layout. {scratch ? 'Use the scaled plan below as the reference for positions and sizes.' : ''}</p>
          </div>
        )}

        {scratch && plan && (
          <div id="garden-plan" className={card}>
            <h2 className="font-serif text-2xl text-forest-800">Your garden plan</h2>
            <p className="mt-1 text-sm text-forest-600">
              {scratch.plot.width} m x {scratch.plot.depth} m, built from the layout you chose.
            </p>
            <div className="mt-4 mx-auto max-w-xl">
              <PlotPreview plot={scratch.plot} elements={scratch.elements} plan={plan} />
            </div>
          </div>
        )}

        {needsPdf && allReady && (
          <div className={card}>
            <h2 className="font-serif text-2xl text-forest-800">Garden plan document</h2>
            {pdfBusy && (
              <p className="mt-3 flex items-center gap-3 text-forest-700">
                <Loader2 className="animate-spin" size={18} /> Creating your PDF...
              </p>
            )}
            {pdfError && (
              <p className="mt-3 text-red-700" role="alert">
                {pdfError}
              </p>
            )}
            {project.pdf.ready && !pdfBusy && (
              <p className="mt-2 text-sm text-forest-600">{project.pdf.level === 2 ? 'Complete implementation plan' : 'Garden plan summary'}, generated {project.pdf.generatedAt ? new Date(project.pdf.generatedAt).toLocaleDateString('en-GB') : ''}. You can download it again at any time at no extra cost.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {project.pdf.ready ? (
                <a href={fileUrl(project.id, 'pdf', { download: true, v: project.pdf.generatedAt || '' })} className="flex items-center gap-2 rounded-full bg-forest-800 px-6 py-3 text-sm text-cream-100 hover:bg-forest-900">
                  <Download size={16} /> Download Garden Plan PDF
                </a>
              ) : (
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={() => {
                    setPdfError(null);
                    void runPdf();
                  }}
                  className="flex items-center gap-2 rounded-full bg-forest-800 px-6 py-3 text-sm text-cream-100 disabled:opacity-60"
                >
                  <RefreshCw size={16} /> {pdfError ? 'Retry PDF (no extra charge)' : 'Create my PDF'}
                </button>
              )}
              {project.pdf.ready && (
                <a href={fileUrl(project.id, 'pdf', { v: project.pdf.generatedAt || '' })} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 text-sm text-forest-800 hover:bg-forest-50">
                  <FileText size={16} /> View in browser
                </a>
              )}
              {scratch && (
                <a href="#garden-plan" className="flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 text-sm text-forest-800 hover:bg-forest-50">
                  View My Garden Plan
                </a>
              )}
              <Link to={{ pathname: '/', hash: '#quote' }} className="flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 text-sm text-forest-800 hover:bg-forest-50">
                Request a Garden Quote
              </Link>
            </div>
          </div>
        )}

        {allReady && <GardenQuoteCta reference={project.reference} />}
      </section>
    </DesignerShell>
  );
}
