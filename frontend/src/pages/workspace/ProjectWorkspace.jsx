import React, { useEffect, useState } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { getProject } from '../../api/projectsApi';
import { useToast } from '../../context/ToastContext';

const tabs = [
  { label: 'Overview', path: '' },
  { label: 'AI', path: 'ai' },
  { label: 'Research', path: 'research' },
  { label: 'Brand', path: 'brand' },
  { label: 'Documentation', path: 'docs' },
  { label: 'Submission', path: 'submission' },
  { label: 'Timeline', path: 'timeline' },
];

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getProject(projectId)
      .then((data) => setProject(data.project))
      .catch((err) => {
        addToast(err.message);
        navigate('/projects');
      })
      .finally(() => setLoading(false));
  }, [projectId, addToast, navigate]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-ash border-t-white rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!project) return null;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="mb-8">
          <p className="text-dark-ash text-sm mb-1">Project</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-charcoal text-sm mt-2 max-w-2xl">{project.description}</p>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-ash/25 mb-8 pb-px">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path === '' ? `/projects/${projectId}` : `/projects/${projectId}/${tab.path}`}
              end={tab.path === ''}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                  isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-dark-ash hover:text-charcoal'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <Outlet context={{ project, setProject }} />
      </div>
    </AppShell>
  );
}
