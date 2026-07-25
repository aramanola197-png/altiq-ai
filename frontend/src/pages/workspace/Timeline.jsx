import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';
import { getTimeline } from '../../api/workspaceApi';
import { useToast } from '../../context/ToastContext';

export default function Timeline() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getTimeline(projectId)
      .then((data) => setEvents(data.events || []))
      .catch((err) => addToast(err.message))
      .finally(() => setLoading(false));
  }, [projectId, addToast]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Activity Timeline</h2>
        <p className="text-ash text-sm mt-1">Chronological record for {project.name}.</p>
      </div>

      {loading ? (
        <GlassCard className="p-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-light-ash/50 rounded animate-pulse" />
          ))}
        </GlassCard>
      ) : events.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-charcoal text-sm">
            No activity yet. Creating the project, chatting with AI, and generating research or brand guidance will appear here.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <GlassCard key={ev._id} className="p-5 flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-ash mt-2 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{ev.details || ev.action}</p>
                <p className="text-xs text-ash mt-1">{new Date(ev.createdAt).toLocaleString()}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
