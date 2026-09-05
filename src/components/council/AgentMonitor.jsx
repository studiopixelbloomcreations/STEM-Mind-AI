import { useEffect, useMemo, useRef, useState } from 'react';
import { agentList } from '../../council/roster.js';

/* ==========================================================================
   Agent Activity Monitor — the real-time parallel council visualization.
   Renders every agent simultaneously, each with its own live status,
   per-agent timing, and a real output snippet as work resolves. This is
   the same component on the landing page (full), during quiz generation
   (compact), and in the teacher dashboard (health panel).
   ========================================================================== */

const STATUS_LABEL = { queued: 'queued', running: 'running', done: 'done', error: 'error' };

export default function AgentMonitor({ events = [], agents, compact = false, running = false, title }) {
  const roster = useMemo(() => agents || agentList(), [agents]);
  const [times, setTimes] = useState({});
  const rafRef = useRef(0);

  // Fold the event stream into per-agent status + output snippets.
  const state = useMemo(() => foldEvents(events, roster), [events, roster]);
  const runningIds = useMemo(
    () => roster.filter((a) => state[a.id]?.status === 'running').map((a) => a.id),
    [roster, state]
  );
  const startedAt = useRef({});
  useEffect(() => {
    for (const id of runningIds) {
      const s = state[id];
      if (startedAt.current[id] == null && s?.startedAt != null) startedAt.current[id] = s.startedAt;
    }
  }, [runningIds, state]);

  // While any agent runs, tick the elapsed readouts at 10fps.
  useEffect(() => {
    if (runningIds.length === 0) return;
    let live = true;
    const tick = () => {
      if (!live) return;
      const now = performance.now();
      setTimes(Object.fromEntries(
        runningIds.map((id) => [id, now - (startedAt.current[id] ?? now)])
      ));
      rafRef.current = setTimeout(tick, 100);
    };
    tick();
    return () => { live = false; clearTimeout(rafRef.current); };
  }, [runningIds]);

  const doneCount = roster.filter((a) => state[a.id]?.status === 'done').length;
  const errCount = roster.filter((a) => state[a.id]?.status === 'error').length;

  return (
    <div className={`nx-agents ${compact ? 'nx-agents--compact' : ''}`} role="status" aria-label="AI council activity">
      {title && (
        <div className="nx-agents__head">
          <span className="nx-label">{title}</span>
          {running && <span className="nx-chip nx-chip--amber"><span className="nx-dot nx-dot--live" />run active</span>}
          {!running && doneCount === 0 && <span className="nx-chip">idle</span>}
          {doneCount > 0 && (
            <span className={`nx-chip ${errCount ? 'nx-chip--alert' : 'nx-chip--resolve'}`}>
              {doneCount}/{roster.length} resolved{errCount ? ` · ${errCount} failed` : ''}
            </span>
          )}
        </div>
      )}
      {roster.map((a) => {
        const s = state[a.id] || { status: 'queued' };
        const cls = `nx-agent nx-agent--${s.status}`;
        const elapsed = s.status === 'running'
          ? ((times[a.id] ?? 0) / 1000).toFixed(1) + 's'
          : s.elapsed != null ? (s.elapsed / 1000).toFixed(1) + 's' : '—';
        return (
          <div key={a.id} className={cls}>
            <span className="nx-agent__rail" aria-hidden="true" />
            <span className="nx-agent__name">
              {a.name}
              {!compact && <span className="nx-agent__role">{a.role}</span>}
            </span>
            <span className="nx-agent__time">{elapsed}</span>
            {(s.status === 'running' || s.status === 'done' || s.status === 'error') && (
              <span className="nx-agent__out">
                {s.status === 'error' ? 'needs sign-in to run live' : s.snippet || STATUS_LABEL[s.status]}
              </span>
            )}
            <span className="nx-u-sr">{`agent ${a.name}: ${s.status}`}</span>
          </div>
        );
      })}
    </div>
  );
}

function blankState(roster) {
  return Object.fromEntries(roster.map((a) => [a.id, { status: 'queued' }]));
}

/** Fold the orchestrator event stream into per-agent monitor state. */
// eslint-disable-next-line react-refresh/only-export-components
export function foldEvents(events, roster) {
  const state = blankState(roster);
  for (const e of events) {
    const a = state[e.agentId];
    if (!a) continue;
    if (e.type === 'agent:start') {
      state[e.agentId] = { status: 'running', startedAt: e.at };
    } else if (e.type === 'agent:done') {
      state[e.agentId] = {
        status: 'done',
        elapsed: e.at - (a.startedAt ?? e.at),
        snippet: snippetOf(e.output),
      };
    } else if (e.type === 'agent:error') {
      state[e.agentId] = {
        status: 'error',
        elapsed: e.at - (a.startedAt ?? e.at),
        snippet: e.error ? String(e.error).slice(0, 60) : 'failed',
      };
    }
  }
  return state;
}

const snippetOf = (out) => {
  const s = String(out ?? '').replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, 60) + (s.length > 60 ? '…' : '') : 'done';
};
