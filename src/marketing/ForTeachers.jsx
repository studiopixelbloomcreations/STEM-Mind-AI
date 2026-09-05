import { Button, Cell, Chip, Index, Meter, Settle } from '../components/ui/index.jsx';

/* ==========================================================================
   For Teachers — landing section 05. The deliberate register shift: the
   whole section sits on .nx-paper (warm daylight) — the control room with
   the lights on. Data-dense, calm, professional. Roster and cells are a
   PREVIEW with sample data, labeled as such in mono.
   ========================================================================== */

/* Sample roster — illustrative preview, clearly labeled below. */
const ROSTER = [
  { name: 'Amaya Perera', grade: 10, mastery: { Physics: 72, Chemistry: 58 }, streak: 12, lastActive: '2h ago' },
  { name: 'Dinesh Fernando', grade: 11, mastery: { Physics: 45 }, streak: 4, lastActive: 'today' },
  { name: 'Sanduni Wick', grade: 9, mastery: { Chemistry: 81, Biology: 66 }, streak: 21, lastActive: '1d ago' },
  { name: 'Rashid Hussain', grade: 10, mastery: { Maths: 34 }, streak: 0, lastActive: '3d ago' },
  { name: 'Tharindu Silva', grade: 11, mastery: { Physics: 63, Maths: 77 }, streak: 8, lastActive: 'today' },
];

const CELLS = [
  { k: 'Class mastery', v: '64%', note: 'median, all topics' },
  { k: 'Active streaks', v: '4/5', note: 'students, this week' },
  { k: 'Sessions this week', v: '23', note: 'adaptive runs' },
  { k: 'Weak-area flags', v: '2', note: 'need attention' },
];

export default function ForTeachers() {
  return (
    <section className="nx-mkt-section nx-paper m-teachers" id="teachers" aria-labelledby="teachers-h">
      <div className="nx-grid">
        <div className="nx-c-7 m-teachers__head">
          <Settle>
            <Index n={5}>For teachers</Index>
          </Settle>
          <Settle delay={90} as="h2" className="nx-mkt-h2 m-teachers__h2" id="teachers-h">
            You teach the room.<br />
            <em className="m-teachers__em">We keep the ledger.</em>
          </Settle>
          <Settle delay={180}>
            <p className="nx-mkt-lede m-teachers__lede">
              Every session your students run writes back to one page —
              mastery per topic, effort per week, the two names that need
              you tomorrow morning. No dashboards to learn; a table you
              already know how to read.
            </p>
          </Settle>
        </div>

        <div className="nx-c-5 m-teachers__meta">
          <Settle delay={240}>
            <div className="m-teachers__cells">
              {CELLS.map((c) => (
                <div key={c.k} className="m-teachers__cell">
                  <Cell k={c.k} v={c.v} tone={c.k === 'Weak-area flags' ? 'resolve' : undefined} />
                  <span className="m-teachers__cell-note">{c.note}</span>
                </div>
              ))}
            </div>
          </Settle>
        </div>

        <Settle delay={120} className="nx-c-12 m-teachers__table-wrap">
          <div className="m-teachers__table-head">
            <h3 className="nx-label nx-label--plain">Roster · live preview</h3>
            <span className="m-teachers__sample-note">Preview with sample data.</span>
          </div>
          <div className="m-teachers__table-scroll" tabIndex={0} role="region" aria-label="Roster preview table">
            <table className="nx-table m-teachers__table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Grade</th>
                  <th scope="col">Mastery by subject</th>
                  <th scope="col">Streak</th>
                  <th scope="col">Last active</th>
                </tr>
              </thead>
              <tbody>
                {ROSTER.map((s) => (
                  <tr key={s.name}>
                    <th scope="row" className="m-teachers__name">{s.name}</th>
                    <td className="nx-num">{s.grade}</td>
                    <td>
                      <div className="m-teachers__mastery">
                        {Object.entries(s.mastery).map(([subj, pct]) => (
                          <span key={subj} className="m-teachers__mrow">
                            <span className="m-teachers__msubj">{subj}</span>
                            <Meter value={pct} tone={pct < 50 ? 'alert' : undefined} />
                            <span className="nx-num m-teachers__mval">{pct}%</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {s.streak > 0 ? (
                        <Chip tone="resolve">{s.streak}-day</Chip>
                      ) : (
                        <Chip tone="alert">cold</Chip>
                      )}
                    </td>
                    <td className="nx-num">{s.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Settle delay={360}>
            <div className="m-teachers__actions">
              <Button variant="primary" onClick={() => { window.location.hash = '#app'; }}>
                Open the dashboard
              </Button>
              <span className="m-teachers__note">
                The real dashboard updates after every session your students run.
              </span>
            </div>
          </Settle>
        </Settle>
      </div>
    </section>
  );
}
