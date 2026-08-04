import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';

export default function PlaceholderTab({ title, description }) {
  const { project } = useOutletContext();
  return (
    <GlassCard className="p-12 text-center">
      <h2 className="font-heading text-xl font-semibold mb-3">{title}</h2>
      <p className="text-charcoal text-sm max-w-md mx-auto leading-relaxed">
        {description || `This module for “${project.name}” is under active development and will be available in a later phase.`}
      </p>
    </GlassCard>
  );
}
