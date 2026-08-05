import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { GlassCard } from '../components/Glass';
import { listProjects, createProject } from '../api/projectsApi';
import { useToast } from '../context/ToastContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    listProjects()
      .then((data) => setProjects(data.projects || []))
      .catch((err) => addToast(err.message))
      .finally(() => setLoading(false));
  }, [addToast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const data = await createProject({ name: name.trim(), description });
      addToast('Project created.');
      navigate(`/projects/${data.project._id}`);
    } catch (err) {
      addToast(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">Projects</h1>
            <p className="text-dark-ash text-sm">Each project is an isolated workspace.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-full bg-black text-white font-semibold text-sm hover:bg-charcoal transition"
          >
            New Project
          </button>
        </div>

        {showForm && (
          <GlassCard className="p-8 mb-10">
            <h2 className="font-heading font-semibold text-lg mb-6">Create project</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm text-dark-ash mb-2">Project name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
                  placeholder="e.g. Clarity Tools"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Short description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition resize-none"
                  placeholder="What are you building?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-3 rounded-full bg-black text-white font-semibold text-sm hover:bg-charcoal transition disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-full border border-ash/30 text-sm hover:bg-black/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-card animate-pulse bg-charcoal/60" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <h3 className="font-heading font-semibold text-lg mb-3">No projects yet</h3>
            <p className="text-charcoal text-sm mb-6">
              Create your first project to open a dedicated workspace with AI, research, branding, and documentation.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-full bg-black text-white font-semibold text-sm hover:bg-charcoal transition"
            >
              Create first project
            </button>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="block transition-transform duration-300 hover:-translate-y-1"
              >
                <GlassCard className="p-7 h-full flex flex-col">
                  <h3 className="font-heading font-semibold text-lg mb-2 text-black">{p.name}</h3>
                  <p className="text-charcoal text-sm leading-relaxed mb-3 line-clamp-3">
                    {p.description ||
                      'No description yet. Open the workspace to define the problem, audience, and Stacks integration.'}
                  </p>
                  <p className="text-dark-ash text-xs leading-relaxed mb-4 flex-1">
                    This workspace guides you from idea through research, branding, documentation,
                    opportunity matching, and submission prep inside the Stacks and Zero Authority
                    DAO ecosystem — without inventing grants or bounties.
                  </p>
                  <div className="flex items-center justify-between text-xs text-dark-ash pt-1 border-t border-ash/20">
                    <span className="capitalize font-medium text-charcoal">{p.stage}</span>
                    <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
