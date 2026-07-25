import React from 'react';
import { glassCardStyle, glassPanelStyle, glassStyle } from '../design/glass';

/**
 * Reusable glass surfaces.
 * All glass in the app should come from these components.
 */

export function GlassCard({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={className}
      style={{ ...glassCardStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassPanel({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={className}
      style={{ ...glassPanelStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassSurface({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={className}
      style={{ ...glassStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
