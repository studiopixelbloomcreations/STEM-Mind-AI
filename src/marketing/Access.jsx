import { Button, Index, Settle } from '../components/ui/index.jsx';

/* ==========================================================================
   Access — landing section 06. No pricing theater: NexLearn is
   teacher-provisioned, so access is described exactly as it works.
   Two calm blocks (teachers / students), then one single ask —
   the only CTA on the page stack. No countdowns, no tiers, no grid.
   ========================================================================== */

const goApp = () => { window.location.hash = '#app'; };

export default function Access() {
  return (
    <section className="nx-mkt-section m-access" id="access" aria-labelledby="access-h">
      <div className="nx-grid">
        <div className="nx-c-5 m-access__intro">
          <Settle>
            <Index n={6}>Access</Index>
          </Settle>
          <Settle delay={90} as="h2" className="nx-mkt-h2 m-access__h2" id="access-h">
            Access comes<br />
            through your<br />
            <em className="m-access__em">teacher.</em>
          </Settle>
          <Settle delay={200}>
            <p className="nx-mkt-lede m-access__lede">
              NexLearn is provisioned by teachers, not sold by seat.
              Your teacher creates the sessions; you simply show up to
              them. That’s the whole model, and it’s the honest one.
            </p>
          </Settle>
        </div>

        <div className="nx-c-6 m-access__blocks">
          <Settle delay={160} as="article" className="m-access__block">
            <h3 className="m-access__block-title">For teachers</h3>
            <p className="m-access__block-text">
              Create student profiles, launch adaptive sessions, and read
              the analytics that come back. Free while in development —
              in exchange for what doesn’t work.
            </p>
          </Settle>

          <Settle delay={280} as="article" className="m-access__block">
            <h3 className="m-access__block-title">For students</h3>
            <p className="m-access__block-text">
              Join with the session your teacher set up. The tutor, the
              council, the whiteboard — all of it, the moment you sign in.
            </p>
          </Settle>
        </div>

        <div className="nx-c-12">
          <Settle delay={340}>
            <div className="m-access__cta">
              <p className="m-access__cta-line">The tutor is waiting.</p>
              <div className="m-access__actions">
                <Button variant="primary" size="lg" onClick={goApp}>
                  Start a session
                </Button>
                <a className="nx-link m-access__alt" href="#app">
                  Sign in with Google →
                </a>
              </div>
            </div>
          </Settle>
        </div>
      </div>
    </section>
  );
}
