import { lazy, Suspense } from 'react';
import { Button, Label, Settle } from '../components/ui/index.jsx';

/* ==========================================================================
   Landing hero — the tutor's lamp.
   Asymmetric editorial composition: type carries the idea, Nex carries
   the proof. One amber vignette behind the avatar = the lamp itself.
   ========================================================================== */

const Nex = lazy(() => import('../components/nex/Nex.jsx'));

export default function Hero() {
  return (
    <header className="nx-mkt-section m-hero" id="top">
      <div className="nx-grid">
        <div className="nx-c-7 m-hero__type">
          <Settle delay={0}>
            <Label>The adaptive STEM tutor · Grades 9–11</Label>
          </Settle>

          <Settle delay={90} as="h1" className="m-hero__h1">
            A tutor that notices<br />
            <em className="m-hero__em">when you&rsquo;re stuck.</em>
          </Settle>

          <Settle delay={180}>
            <p className="m-hero__lede">
              Quiz banks hand every student the same worksheet. NexLearn watches
              how you answer — and when it goes wrong, the tutor builds the
              lesson on the spot, step by step, on a whiteboard you can follow.
            </p>
          </Settle>

          <Settle delay={270}>
            <div className="m-hero__actions">
              <Button variant="primary" onClick={() => { window.location.hash = '#app'; }}>
                Start a session
              </Button>
              <a className="nx-link m-hero__alt" href="#council">
                Watch the council think
              </a>
            </div>
          </Settle>

          <Settle delay={360}>
            <div className="m-hero__meta">
              <span className="nx-num">13</span> specialist agents
              <span aria-hidden="true" className="m-hero__sep" />
              <span className="nx-num">04</span> question types
              <span aria-hidden="true" className="m-hero__sep" />
              <span className="nx-num">01</span> tutor that teaches
            </div>
          </Settle>
        </div>

        <div className="nx-c-5 m-hero__stage" aria-hidden="true">
          <div className="m-hero__lamp" />
          <Suspense fallback={<div className="m-hero__fallback" />}>
            <Nex className="m-hero__nex" speechBubble="I pick the question. You pick the pace." />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
