import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllProjects,
  createProject,
  updateProject,
  deleteProject,
  toggleProjectPublished,
} from '@/lib/projects';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
import type { Project, ProjectInput } from '@/types/project';
import ProjectForm from '@/components/admin/ProjectForm';
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
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [services, setServices] = useState<ServiceAdminItem[]>([]);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    const filters: { search?: string; serviceId?: string; published?: boolean } = {};
    if (search) filters.search = search;
    if (serviceFilter) filters.serviceId = serviceFilter;
    if (publishedFilter === 'published') filters.published = true;
    if (publishedFilter === 'unpublished') filters.published = false;

    const { projects: data, total: count } = await fetchAllProjects(page, PAGE_SIZE, filters);
    setProjects(data);
    setTotal(count);
    setLoadingProjects(false);
  }, [page, search, serviceFilter, publishedFilter]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    fetchPublishedServices().then(setServices);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSave = async (input: ProjectInput, id?: string) => {
    if (id) {
      await updateProject(id, input);
    } else {
      await createProject(input);
    }
    setShowForm(false);
    setEditingProject(null);
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setConfirmDelete(null);
    loadProjects();
  };

  const handleTogglePublished = async (project: Project) => {
    await toggleProjectPublished(project.id, !project.published);
    loadProjects();
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const openAdd = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const getServiceTitle = (serviceId: string) => {
    return services.find((s) => s.id === serviceId)?.title || serviceId;
  };

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search title or location..."
              className="w-full rounded-full border border-sage-300/40 bg-cream-50 py-2.5 pl-10 pr-4 font-sans text-sm text-forest-800 placeholder-forest-400 outline-none focus:border-forest-500"
            />
          </div>
          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setPage(0); }}
            className="rounded-full border border-sage-300/40 bg-cream-50 px-4 py-2.5 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <select
            value={publishedFilter}
            onChange={(e) => { setPublishedFilter(e.target.value as 'all' | 'published' | 'unpublished'); setPage(0); }}
            className="rounded-full border border-sage-300/40 bg-cream-50 px-4 py-2.5 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-2.5 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800"
        >
          <Plus size={16} />
          Add Project
        </button>
      </div>

      {loadingProjects ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-forest-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-sans text-sm text-forest-500">No projects found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-cream-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage-200 bg-sage-50/50">
                    <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600">Project</th>
                    <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600">Service</th>
                    <th className="hidden px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600 sm:table-cell">Location</th>
                    <th className="px-4 py-3 text-center font-sans text-xs uppercase tracking-widest-2 text-forest-600">Status</th>
                    <th className="px-4 py-3 text-right font-sans text-xs uppercase tracking-widest-2 text-forest-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-sage-100 transition-colors last:border-0 hover:bg-sage-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-24 shrink-0 overflow-hidden rounded-lg">
                            <img src={project.before_image} alt="" className="h-full w-1/2 object-cover" loading="lazy" />
                            <img src={project.after_image} alt="" className="h-full w-1/2 object-cover" loading="lazy" />
                          </div>
                          <div>
                            <p className="font-sans text-sm font-medium text-forest-800">{project.title}</p>
                            <p className="font-sans text-xs text-forest-400">Order: {project.sort_order}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-sage-100 px-3 py-1 font-sans text-xs text-forest-600">
                          {getServiceTitle(project.service_id)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 font-sans text-sm text-forest-600 sm:table-cell">
                        {project.location}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePublished(project)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs transition-colors ${
                            project.published
                              ? 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                              : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                          }`}
                        >
                          {project.published ? <Eye size={12} /> : <EyeOff size={12} />}
                          {project.published ? 'Published' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(project)}
                            className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(project)}
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
              <p className="font-sans text-sm text-forest-500">
                Page {page + 1} of {totalPages} ({total} projects)
              </p>
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
        <ProjectForm
          project={editingProject}
          services={services}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProject(null); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-2xl">
            <h3 className="font-serif text-xl font-medium text-forest-800">Delete Project?</h3>
            <p className="mt-3 font-sans text-sm text-forest-600">
              Are you sure you want to delete "{confirmDelete.title}"? This action cannot be undone.
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
