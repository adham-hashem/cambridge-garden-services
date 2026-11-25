import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Loader2 } from 'lucide-react';
import DesignerShell from '@/components/designer/DesignerShell';
import { fileUrl, listProjects, redeemRecovery, requestRecovery, type ProjectView } from '@/lib/designer/api';
import { formatGbp } from '@/lib/designer/shared';

export default function MyVisualizations() {
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState<ProjectView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const recoverToken = params.get('recover');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (recoverToken) {
        try {
          await redeemRecovery(recoverToken);
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'This link is no longer valid');
        }
        const next = new URLSearchParams(params);
        next.delete('recover');
        setParams(next, { replace: true });
      }
      try {
        const list = await listProjects();
        if (!cancelled) setProjects(list);
      } catch {
        // 401 means this browser has no saved projects yet.
        if (!cancelled) setProjects([]);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setRecoveryMessage(null);
    try {
      const result = await requestRecovery(email.trim());
      setRecoveryMessage(result.message);
    } catch (err) {
      setRecoveryMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  };

  return (
    <DesignerShell title="My Visualizations | Cambridge Garden Services" description="Your saved AI garden designs, garden plans and PDF documents." noIndex>
      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <h1 className="font-serif text-4xl text-forest-800">My Visualizations</h1>
        <p className="mt-2 text-forest-600">Your original photographs, generated designs, garden plans and PDF documents. Only you can see them.</p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {!projects ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-forest-600" size={28} />
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-sage-200 bg-white p-10 text-center">
            <p className="font-serif text-2xl text-forest-800">No saved projects on this device yet</p>
            <Link to="/ai-garden-designer" className="mt-5 inline-block rounded-full bg-forest-800 px-6 py-3 text-sm text-cream-100">
              Start a garden design
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const firstReady = project.images.find((image) => image.status === 'ready');
              return (
                <article key={project.id} className="flex flex-col overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-sm">
                  <div className="grid aspect-[3/2] grid-cols-2 gap-px bg-sage-100">
                    {project.kind === 'redesign' && project.hasOriginal && (
                      <img src={fileUrl(project.id, 'original')} alt="Original garden" className="h-full w-full object-cover" loading="lazy" />
                    )}
                    {firstReady ? (
                      <img
                        src={fileUrl(project.id, 'concept', { index: firstReady.index })}
                        alt="Generated garden design"
                        className={`h-full w-full object-cover ${project.kind === 'redesign' && project.hasOriginal ? '' : 'col-span-2'}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className={`flex items-center justify-center bg-cream-100 p-4 text-center text-sm text-forest-500 ${project.kind === 'redesign' && project.hasOriginal ? '' : 'col-span-2'}`}>
                        {project.paid ? 'Design not generated yet' : 'Awaiting payment'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs uppercase tracking-wider text-sage-600">
                      {project.kind === 'scratch' ? 'Garden plan' : 'Redesign'} · {project.reference}
                    </p>
                    <h2 className="mt-1 font-serif text-xl text-forest-800">{project.title}</h2>
                    <p className="mt-1 text-sm text-forest-600">
                      {project.package.name} ({formatGbp(project.package.pricePence)}) · {new Date(project.createdAt).toLocaleDateString('en-GB')}
                    </p>
                    <p className="mt-1 text-sm text-forest-600">{project.paid ? 'Paid' : 'Not paid'}</p>
                    <div className="mt-4 flex flex-wrap gap-3 pt-2">
                      <Link to={`/ai-garden-designer/project/${project.id}`} className="rounded-full bg-forest-800 px-4 py-2 text-sm text-cream-100">
                        {project.paid ? 'Open project' : 'Resume'}
                      </Link>
                      {project.pdf.ready && (
                        <a href={fileUrl(project.id, 'pdf', { download: true, v: project.pdf.generatedAt || '' })} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 text-sm text-forest-800">
                          <Download size={14} /> PDF
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <form onSubmit={sendRecovery} className="mt-12 max-w-xl rounded-2xl border border-sage-200 bg-white p-6">
          <h2 className="font-serif text-xl text-forest-800">Using a different device?</h2>
          <p className="mt-1 text-sm text-forest-600">Enter the email address you used at checkout and we will send you a link to restore your paid projects.</p>
          <div className="mt-4 flex gap-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" className="flex-1 rounded-lg border border-sage-300 px-4 py-2" />
            <button type="submit" disabled={sending} className="rounded-full bg-forest-800 px-5 py-2 text-sm text-cream-100 disabled:opacity-60">
              {sending ? 'Sending...' : 'Send link'}
            </button>
          </div>
          {recoveryMessage && <p className="mt-3 text-sm text-forest-700">{recoveryMessage}</p>}
        </form>
      </section>
    </DesignerShell>
  );
}
