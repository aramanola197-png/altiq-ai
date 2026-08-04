import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';

export default function Overview() {
  const { project } = useOutletContext();

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <GlassCard className="p-7">
          <h3 className="font-heading font-semibold mb-3 text-black">Stage</h3>
          <p className="text-charcoal capitalize">{project.stage}</p>
        </GlassCard>
        <GlassCard className="p-7">
          <h3 className="font-heading font-semibold mb-3 text-black">Workspace</h3>
          <p className="text-charcoal text-sm">Use the tabs above for AI, research, brand, docs, and submission prep.</p>
        </GlassCard>
      </div>

      <GlassCard className="p-7">
        <h3 className="font-heading font-semibold mb-4 text-black">Project details</h3>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-dark-ash">Problem</dt>
            <dd className="text-charcoal mt-1">{project.problem || 'Not yet defined'}</dd>
          </div>
          <div>
            <dt className="text-dark-ash">Target audience</dt>
            <dd className="text-charcoal mt-1">{project.targetAudience || 'Not yet defined'}</dd>
          </div>
          <div>
            <dt className="text-dark-ash">Stacks integration</dt>
            <dd className="text-charcoal mt-1">{project.stacksIntegration || 'Not yet defined'}</dd>
          </div>
          {project.mission && (
            <div>
              <dt className="text-dark-ash">Mission</dt>
              <dd className="text-charcoal mt-1">{project.mission}</dd>
            </div>
          )}
        </dl>
      </GlassCard>

      <GlassCard className="p-7">
        <h3 className="font-heading font-semibold mb-3 text-black">Next steps</h3>
        <p className="text-charcoal text-sm mb-4">
          Start with AI or Research, refine branding and documentation, then match official opportunities and prepare a submission draft.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/projects/${project._id}/ai`}
            className="inline-block px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition"
          >
            Open AI Workspace
          </Link>
          <Link
            to={`/projects/${project._id}/research`}
            className="inline-block px-5 py-2.5 rounded-full border border-ash/40 text-sm font-medium hover:bg-black/5 transition"
          >
            Research
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
