import { Index, Meter, Settle } from '../components/ui/index.jsx';

/* ==========================================================================
   Proof / Outcomes — landing section 04.
   Hard rule: no fabricated numbers. We design the measurement SYSTEM and
   let the empty states say so in plain type. Three metrics, defined now,
   reported when the first cohort has actually used the product.
   ========================================================================== */

const METRICS = [
  {
    n: 'i',
    name: 'Mastery growth',
    def: 'Change in topic mastery per student, per week — the slope, not the score. Positive means the tutor is doing its job.',
    note: 'Δ mastery / topic / week',
  },
  {
    n: 'ii',
    name: 'Time-to-understanding',
    def: 'Median sessions from first exposure to first-correct. How long the road from “never seen it” to “can do it” really takes.',
    note: 'median sessions · first exposure → first correct',
  },
  {
    n: 'iii',
    name: 'Adaptive accuracy',
    def: 'Share of council difficulty recommendations that matched the student’s measured capability — neither insult nor ambush.',
    note: '% council recommendations at level',
  },
];

export default function Proof() {
  return (
    <section className="nx-mkt-section m-proof" id="outcomes" aria-labelledby="proof-h">
      <div className="nx-grid">
        <div className="nx-c-4 m-proof__intro">
          <Settle>
            <Index n={4}>Proof</Index>
          </Settle>
          <Settle delay={90} as="h2" className="nx-mkt-h2 m-proof__h2" id="proof-h">
            The numbers<br />
            will earn<br />
            <em className="m-proof__em">their place.</em>
          </Settle>
          <Settle delay={200}>
            <p className="m-proof__lede">
              Most learning platforms open with a wall of statistics. We
              can’t show you outcomes yet, because nobody has learned here
              — and we won’t invent them. These are the three things we
              will measure, defined precisely, from the first cohort on.
            </p>
          </Settle>
        </div>

        <div className="nx-c-8 m-proof__metrics">
          {METRICS.map((m, i) => (
            <Settle
              key={m.n}
              delay={120 + i * 140}
              as="article"
              className={`m-proof__metric${i === 1 ? ' m-proof__metric--push' : ''}`}
            >
              <span className="m-proof__no nx-num" aria-hidden="true">{m.n}</span>
              <div className="m-proof__body">
                <h3 className="m-proof__name">{m.name}</h3>
                <p className="m-proof__def">{m.def}</p>
                <div className="m-proof__pending">
                  <span className="m-proof__pending-note">
                    {m.note} — measuring from first cohort
                  </span>
                </div>
              </div>
            </Settle>
          ))}

          <Settle delay={560} className="m-proof__await">
            <div className="m-proof__await-row">
              <span className="m-proof__await-label">Awaiting data</span>
              <Meter value={0} />
            </div>
            <p className="m-proof__await-note">
              Every number on this page will come from real sessions.
              Until then, nothing here pretends otherwise.
            </p>
          </Settle>
        </div>
      </div>
    </section>
  );
}
