import { useCallback, useRef, useState } from 'react';
import { Button, Chip, Index, Label, Settle } from '../components/ui/index.jsx';
import AgentMonitor from '../components/council/AgentMonitor.jsx';
import { ROSTER } from '../council/roster.js';
import { runQuestionCycle } from '../council/orchestrator.js';

/* ==========================================================================
   The Council — landing section.
   The monitor shows all thirteen specialists at once; the run is REAL
   (live model calls through the proxy). Without sign-in the rows say so
   honestly — we never fake agent activity.
   ========================================================================== */

const DEMO_CTX = { subject: 'Physics', topic: 'Ohm\u2019s law', grade: 10, difficulty: 'medium', history: [] };
const WAVE_LABELS = [
  { n: 1, label: 'Wave 1 — seven agents, concurrent' },
  { n: 2, label: 'Wave 2 — the question is written' },
  { n: 3, label: 'Wave 3 — reactions fan out' },
  { n: 4, label: 'Wave 4 — fusion' },
  { n: 5, label: 'Wave 5 — the director' },
];

export default function Council() {
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [fused, setFused] = useState(null);
  const abortRef = useRef(null);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setEvents([]);
    setFused(null);
    const controller = new AbortController();
    abortRef.current = controller;
    const push = (e) => setEvents((prev) => [...prev, e]);
    try {
      const q = await runQuestionCycle(DEMO_CTX, { onEvent: push, signal: controller.signal });
      setFused(q);
    } catch {
      /* offline fallback already handled inside the cycle */
    } finally {
      setRunning(false);
    }
  }, [running]);

  return (
    <section className="nx-mkt-section m-council" id="council">
      <div className="nx-grid">
        <div className="nx-c-5">
          <Settle>
            <Index n={3}>The council</Index>
          </Settle>
          <Settle delay={90} as="h2" className="nx-mkt-h2">
            Thirteen specialists.<br />One question, made for you.
          </Settle>
          <Settle delay={180}>
            <p className="nx-mkt-lede">
              Every question is a working session. Seven agents open at once —
              syllabus fit, difficulty, exam tactics — then the question is
              written, and the reactions fan out: validation, misconceptions,
              the whiteboard storyboard, plain wording. One fuse. One director
              for the tutor. Real calls, real timings, visible below.
            </p>
          </Settle>
          <Settle delay={270}>
            <div className="m-council__waves">
              {WAVE_LABELS.map((w) => (
                <span key={w.n} className="nx-chip m-council__wave">
                  {w.label}
                </span>
              ))}
            </div>
          </Settle>
          <Settle delay={360}>
            <div className="m-council__actions">
              <Button variant="secondary" size="sm" onClick={run} disabled={running}>
                {running ? 'Council running…' : 'Run the council'}
              </Button>
              <span className="m-council__note">
                {fused ? 'One item, fused from thirteen.' : 'The council runs live after sign-in — every row is a real model call.'}
              </span>
            </div>
          </Settle>
        </div>

        <div className="nx-c-7">
          <AgentMonitor
            events={events}
            agents={ROSTER.map(({ id, name, role }) => ({ id, name, role }))}
            running={running}
            title="Council activity"
          />
          {fused && (
            <div className="m-council__fused">
              <Label plain>Final item</Label>
              <p className="m-council__q">{fused.question}</p>
              <div className="m-council__chips">
                <Chip tone="amber">{fused.difficulty}</Chip>
                {fused.conceptTags?.slice(0, 3).map((t) => <Chip key={t}>{t}</Chip>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
