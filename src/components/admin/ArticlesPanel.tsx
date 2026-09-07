import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import {
  fetchAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticlePublished,
  uploadArticleImage,
} from '@/lib/articles';
import type { Article, ArticleInput } from '@/types/article';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Check,
  ImageIcon,
} from 'lucide-react';

const PAGE_SIZE = 10;

const emptyForm: ArticleInput = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags: [],
  date: '',
  cover_image: '',
  cover_alt: '',
  published: false,
  sort_order: 0,
};

export default function ArticlesPanel() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Article | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { articles: data, total: count } = await fetchAllArticles(page, PAGE_SIZE, search || undefined);
    setArticles(data);
    setTotal(count);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (input: ArticleInput, id?: string) => {
    if (id) {
      await updateArticle(id, input);
    } else {
      await createArticle(input);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteArticle(id);
    setConfirmDelete(null);
    load();
  };

  const handleTogglePublished = async (article: Article) => {
    await toggleArticlePublished(article.id, !article.published);
    load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search title or category..."
            className="w-full rounded-full border border-sage-300/40 bg-cream-50 py-2.5 pl-10 pr-4 font-sans text-sm text-forest-800 placeholder-forest-400 outline-none focus:border-forest-500"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-2.5 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800"
        >
          <Plus size={16} />
          Add Article
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-forest-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-sans text-sm text-forest-500">No articles found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-cream-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage-200 bg-sage-50/50">
                    <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600">Article</th>
                    <th className="hidden px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600 md:table-cell">Category</th>
                    <th className="hidden px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600 lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-center font-sans text-xs uppercase tracking-widest-2 text-forest-600">Status</th>
                    <th className="px-4 py-3 text-right font-sans text-xs uppercase tracking-widest-2 text-forest-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} className="border-b border-sage-100 last:border-0 hover:bg-sage-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                            <img src={article.cover_image} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <div className="max-w-xs">
                            <p className="truncate font-sans text-sm font-medium text-forest-800">{article.title}</p>
                            <p className="font-sans text-xs text-forest-400">
                              {article.tags.length > 0 ? article.tags.join(', ') : 'No tags'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="rounded-full bg-sage-100 px-3 py-1 font-sans text-xs text-forest-600">
                          {article.category}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 font-sans text-sm text-forest-600 lg:table-cell">
                        {article.date}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePublished(article)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs transition-colors ${
                            article.published
                              ? 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                              : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                          }`}
                        >
                          {article.published ? <Eye size={12} /> : <EyeOff size={12} />}
                          {article.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditing(article); setShowForm(true); }}
                            className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(article)}
                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="font-sans text-sm text-forest-500">Page {page + 1} of {totalPages} ({total} articles)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 rounded-full border border-sage-300 px-4 py-2 font-sans text-sm text-forest-700 transition-all hover:bg-sage-100 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 rounded-full border border-sage-300 px-4 py-2 font-sans text-sm text-forest-700 transition-all hover:bg-sage-100 disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ArticleForm
          article={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-2xl">
            <h3 className="font-serif text-xl font-medium text-forest-800">Delete Article?</h3>
            <p className="mt-3 font-sans text-sm text-forest-600">
              Delete "{confirmDelete.title}"? This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 rounded-full bg-red-600 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-white transition-all hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-full border border-sage-300 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-forest-700 transition-all hover:bg-sage-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleForm({
  article,
  onSave,
  onClose,
}: {
  article: Article | null;
  onSave: (input: ArticleInput, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ArticleInput>(
    article
      ? {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          tags: article.tags,
          date: article.date,
          cover_image: article.cover_image,
          cover_alt: article.cover_alt,
          published: article.published,
          sort_order: article.sort_order,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tagsInput, setTagsInput] = useState(article?.tags.join(', ') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof ArticleInput, value: string | number | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadArticleImage(file);
    setUploading(false);
    if (!url) {
      setError('Failed to upload image. Please try again.');
      return;
    }
    update('cover_image', url);
    if (!form.cover_alt) {
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      update('cover_alt', baseName);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim() || !form.category.trim() || !form.date.trim() || !form.cover_image.trim()) {
      setError('All fields except tags are required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, tags }, article?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-200 bg-cream-50 px-6 py-4">
          <h2 className="font-serif text-xl font-medium text-forest-800">
            {article ? 'Edit Article' : 'Add New Article'}
          </h2>
          <button onClick={onClose} className="text-forest-600 hover:text-forest-800"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {/* Cover Image Upload */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              Cover Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
            {form.cover_image ? (
              <div className="relative overflow-hidden rounded-xl border border-sage-200">
                <img src={form.cover_image} alt="" className="h-40 w-full object-cover" />
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-cream-50">
                  <Check size={14} />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 left-0 right-0 bg-forest-950/70 py-2 font-sans text-xs text-cream-100 transition-colors hover:bg-forest-950/90 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Replace Image'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sage-400/50 bg-cream-100/30 py-8 font-sans text-sm text-forest-600 transition-colors hover:border-forest-500 hover:bg-cream-100 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-forest-500" />
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
                      <ImageIcon size={20} className="text-forest-500" />
                    </div>
                    <span>Click to upload cover image</span>
                  </>
                )}
              </button>
            )}
            <input
              type="text"
              value={form.cover_image}
              onChange={(e) => update('cover_image', e.target.value)}
              placeholder="Or paste image URL..."
              className="mt-2 w-full rounded-lg border border-sage-200/40 bg-cream-100/30 px-3 py-2 font-sans text-xs text-forest-700 placeholder-forest-400 outline-none focus:border-forest-400"
            />
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          {/* Category + Date */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                required
                placeholder="e.g. Seasonal Care"
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
              />
            </div>
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Date</label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                required
                placeholder="e.g. September 2026"
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. autumn, planting, seasonal"
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
              required
              rows={2}
              className="w-full resize-none rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              required
              rows={8}
              className="w-full resize-y rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          {/* Cover Alt Text */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Cover Image Alt Text</label>
            <input
              type="text"
              value={form.cover_alt}
              onChange={(e) => update('cover_alt', e.target.value)}
              required
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          {/* Sort Order + Published */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 pb-3">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => update('published', e.target.checked)}
                  className="h-5 w-5 rounded accent-forest-600"
                />
                <span className="font-sans text-sm text-forest-700">Published</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {article ? 'Save Changes' : 'Create Article'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-sage-300 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-forest-700 transition-all hover:bg-sage-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
