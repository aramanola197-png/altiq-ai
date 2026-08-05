import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';

function buildAbout(project) {
  const name = project.name || 'This project';
  const desc = (project.description || '').trim();
  const problem = (project.problem || '').trim();
  const audience = (project.targetAudience || '').trim();
  const stacks = (project.stacksIntegration || '').trim();
  const mission = (project.mission || '').trim();
  const stage = project.stage || 'idea';

  const parts = [];

  if (desc) {
    parts.push(desc);
  } else {
    parts.push(
      `${name} is in the ${stage} stage. Capture a clear description in the project details so research, branding, and opportunity matching stay accurate.`
    );
  }

  if (problem) {
    parts.push(`Problem it addresses: ${problem}`);
  }
  if (audience) {
    parts.push(`Who it is for: ${audience}`);
  }
  if (stacks) {
    parts.push(`Stacks / ecosystem angle: ${stacks}`);
  }
  if (mission) {
    parts.push(`Mission: ${mission}`);
  }

  if (!problem && !audience && !stacks) {
    parts.push(
      'Use the AI workspace and Research tabs to refine the problem, audience, and how this idea connects to Stacks and Zero Authority DAO — then return here to see the overview update.'
    );
  }

  return parts;
}

export default function Overview() {
  const { project } = useOutletContext();
  const aboutParts = buildAbout(project);

  return (
    <div className="space-y-6">
      <GlassCard className="p-7 sm:p-8">
        <h3 className="font-heading font-semibold mb-3 text-black">About this project</h3>
        <p className="text-xs uppercase tracking-wide text-dark-ash mb-3">{project.name}</p>
        <div className="space-y-3">
          {aboutParts.map((p, i) => (
            <p key={i} className="text-charcoal text-sm leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </GlassCard>

      <div className="grid sm:grid-cols-2 gap-6">
        <GlassCard className="p-7">
          <h3 className="font-heading font-semibold mb-3 text-black">Stage</h3>
          <p className="text-charcoal capitalize">{project.stage}</p>
        </GlassCard>
        <GlassCard className="p-7">
          <h3 className="font-heading font-semibold mb-3 text-black">Workspace</h3>
          <p className="text-charcoal text-sm">
            Use the tabs above for AI, research, brand, docs, and submission prep for {project.name}.
          </p>
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
          Deepen {project.name} with AI or Research, then branding and documentation before matching
          open opportunities.
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
