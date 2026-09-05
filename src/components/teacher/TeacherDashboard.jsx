/* ==========================================================================
   NexLearn — Teacher Dashboard (the control room)
   Registers students, reads real roster analytics from Supabase via
   AppContext only, and hands a live session to a student via
   setActiveStudent. Stats are derived honestly from loaded data — an
   unknown value renders as "—", never an invented number.
   ========================================================================== */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import AgentMonitor from '../council/AgentMonitor.jsx';
import {
  Button, IconButton, Field, Input, Select, Cell, Chip, Meter,
  Spark, Label, Modal, Index, Mark,
} from '../ui/index.jsx';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

/* topic_mastery levels (contract §3.5 / calculateTopicMastery) → pct + tone */
const LEVELS = {
  Master: { pct: 100, tone: 'resolve' },
  Proficient: { pct: 60, tone: 'amber' },
  Beginning: { pct: 25, tone: 'alert' },
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};

const relDays = (iso) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
};

const lastActive = (quizzes) => {
  const ts = quizzes.map((q) => new Date(q.completed_at).getTime()).filter((t) => !Number.isNaN(t));
  if (!ts.length) return null;
  const days = Math.floor((Date.now() - Math.max(...ts)) / 86400000);
  return days <= 0 ? 'Today' : `${days}d ago`;
};

export default function TeacherDashboard() {
  const {
    user, students, registerStudent, setActiveStudent,
    getStudentHistoryAndAnalytics, handleLogout,
  } = useApp();

  const [view, setView] = useState('roster');            // 'roster' | 'council'
  const [navOpen, setNavOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  // per-student analytics (roster view)
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);            // { quizzes, analytics }
  const [detailLoading, setDetailLoading] = useState(false);

  // new-student form
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10');
  const [age, setAge] = useState('');
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedStudent = selectedId
    ? students.find((s) => s.id === selectedId) || null
    : null;

  const openStudent = (s) => {
    // reset synchronously in the handler, not in an effect (cascading renders)
    setDetail(null);
    setDetailLoading(true);
    setSelectedId((id) => (id === s.id ? null : s.id));
    setNavOpen(false);
  };

  const toggleSubject = (subj) =>
    setPicked((p) => (p.includes(subj) ? p.filter((x) => x !== subj) : [...p, subj]));

  const gotoView = (v) => {
    setDetail(null);
    setDetailLoading(false);
    setView(v);
    setNavOpen(false);
  };

  /* ---- per-student analytics: one async load per selection ---- */
  useEffect(() => {
    if (view !== 'roster' || !selectedId) return undefined;
    let alive = true;
    const t = setTimeout(() => setDetailLoading(true), 0); // set state outside the effect body
    getStudentHistoryAndAnalytics(selectedId)
      .then((d) => { if (alive) setDetail(d || { quizzes: [], analytics: {} }); })
      .catch(() => { if (alive) setDetail({ quizzes: [], analytics: {} }); })
      .finally(() => { if (alive) setDetailLoading(false); });
    return () => { alive = false; clearTimeout(t); };
  }, [selectedId, view, getStudentHistoryAndAnalytics]);

  /* ---- new student ---- */
  const closeForm = () => {
    setNewOpen(false);
    setFormError('');
    setName(''); setAge(''); setPicked([]);
  };

  const submitStudent = async (e) => {
    e.preventDefault();
    if (!name.trim() || !age || picked.length === 0) {
      setFormError('Name, age and at least one subject are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const created = await registerStudent(name.trim(), grade, age, picked);
      setSaving(false);
      closeForm();
      if (created) {
        setDetail(null);
        setDetailLoading(true); // panel shows loading until the first fetch lands
        setSelectedId(created.id);
      }
    } catch {
      setSaving(false);
      setFormError('Could not create the profile. Check the connection and try again.');
    }
  };

  const launch = (s) => setActiveStudent(s);

  /* ---- stats: derived honestly; "—" when unknown ---- */
  const stats = useMemo(() => {
    const count = students.length;

    const masteryScores = [];
    students.forEach((s) => {
      Object.values(s.topic_mastery || {}).forEach((lvl) => {
        const p = { Master: 100, Proficient: 60, Beginning: 25 }[lvl];
        if (p != null) masteryScores.push(p);
      });
    });
    const mastery = masteryScores.length
      ? `${Math.round(masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length)}%`
      : '—';

    const streaks = students.reduce((n, s) => {
      const v = Number(s.streak);
      return n + (Number.isFinite(v) ? Math.max(0, v) : 0);
    }, 0);

    const week = students.reduce((n, s) => {
      const arr = Array.isArray(s.quizzes) ? s.quizzes : Array.isArray(s.recent_quizzes) ? s.recent_quizzes : [];
      return n + arr.filter((q) => {
        const d = relDays(q?.completed_at);
        return d != null && d >= 0 && d <= 7;
      }).length;
    }, 0);

    return { count, mastery, streaks, week };
  }, [students]);

  const rosterHasMastery = students.some((s) => Object.keys(s.topic_mastery || {}).length > 0);

  return (
    <div className="nx-shell">
      {/* ---------- Sidebar ---------- */}
      <aside className={`nx-shell__side${navOpen ? ' is-open' : ''}`}>
        <Mark small />

        <nav className="nx-stack nx-gap-2xs" aria-label="Dashboard">
          <button type="button" className={`nx-nav-item${view === 'roster' ? ' nx-nav-item--active' : ''}`} onClick={() => gotoView('roster')}>
            Roster
          </button>
          <button type="button" className={`nx-nav-item${view === 'council' ? ' nx-nav-item--active' : ''}`} onClick={() => gotoView('council')}>
            Council Monitor
          </button>
          <button type="button" className="nx-nav-item" onClick={handleLogout}>
            Sign out
          </button>
        </nav>

        <div className="nx-side-foot">Grade 9–11 · Sri Lankan curriculum</div>
      </aside>

      {navOpen && (
        <button type="button" className="nx-shell__scrim" aria-label="Close menu" onClick={() => setNavOpen(false)} />
      )}

      {/* ---------- Main column ---------- */}
      <div className="nx-shell__main">
        {/* Top bar */}
        <header className="nx-shell__top">
          <div className="nx-top-title">
            <IconButton label="Menu" className="nx-u-menu" onClick={() => setNavOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </IconButton>
            <h1>{view === 'roster' ? 'Roster' : 'Council Monitor'}</h1>
            <Index n={view === 'roster' ? '01' : '02'}>{view === 'roster' ? 'Profiles' : 'Agents'}</Index>
          </div>

          <div className="nx-top-actions">
            {view === 'roster' && (
              <Button size="sm" onClick={() => setNewOpen(true)}>New student</Button>
            )}
            <span className="nx-mono">{user?.email || '—'}</span>
          </div>
        </header>

        {/* ---------- ROSTER VIEW ---------- */}
        {view === 'roster' && (
          <div className="nx-shell__body">

            <div className="nx-stats" role="list" aria-label="Class statistics">
              <div role="listitem"><Cell k="Students" v={students.length} /></div>
              <div role="listitem"><Cell k="Class mastery" v={stats.mastery} /></div>
              <div role="listitem"><Cell k="Active streaks" v={stats.streaks} /></div>
              <div role="listitem"><Cell k="Sessions this week" v={stats.week} /></div>
            </div>

            <div className="nx-head">
              <Index n="03">The roster</Index>
              <span className="nx-note">
                {rosterHasMastery
                  ? 'Mastery levels come from completed quizzes.'
                  : 'Mastery appears after each student completes a quiz.'}
              </span>
            </div>

            {students.length === 0 ? (
              <div className="nx-empty">
                <Label plain>No students yet</Label>
                <p>No students yet — create the first profile.</p>
                <Button size="sm" onClick={() => setNewOpen(true)}>New student</Button>
              </div>
            ) : (
              <div className="nx-table-wrap">
                <table className="nx-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Grade</th>
                      <th scope="col">Subjects</th>
                      <th scope="col">Mastery</th>
                      <th scope="col">Streak</th>
                      <th scope="col">Last active</th>
                      <th scope="col"><span className="nx-u-sr">Open</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const rows = Object.entries(s.topic_mastery || {});
                      const avg = rows.length
                        ? Math.round(rows.reduce((a, [, lvl]) => a + ({ Master: 100, Proficient: 60, Beginning: 25 }[lvl] ?? 0), 0) / rows.length)
                        : null;
                      const tone = avg == null ? null : avg >= 80 ? 'resolve' : avg >= 50 ? 'amber' : 'alert';
                      const label = avg == null ? '—' : avg >= 80 ? 'Master' : avg >= 50 ? 'Proficient' : 'Beginning';
                      const active = selectedId === s.id;
                      return (
                        <tr
                          key={s.id}
                          className={`nx-row--action${active ? ' nx-row--active' : ''}`}
                          tabIndex={0}
                          aria-label={`Open analytics for ${s.name}`}
                          onClick={() => openStudent(s)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStudent(s); }
                          }}
                        >
                          <td className="nx-cell-name">{s.name}</td>
                          <td className="nx-dim">{s.grade ?? '—'}</td>
                          <td>
                            <div className="nx-row-subjects">
                              {(Array.isArray(s.subjects) ? s.subjects : []).length > 0
                                ? s.subjects.map((subj) => <Chip key={subj}>{subj}</Chip>)
                                : <span className="nx-dim">—</span>}
                            </div>
                          </td>
                          <td>
                            <div className="nx-mastery">
                              {avg != null && <Meter value={avg} tone={tone} />}
                              <span className="nx-mastery__label">{label}</span>
                            </div>
                          </td>
                          <td className="nx-dim">
                            {Number.isFinite(Number(s.streak)) ? `${s.streak}d` : '—'}
                          </td>
                          <td className="nx-dim">
                            {Array.isArray(s.quizzes) && s.quizzes.length
                              ? (lastActive(s.quizzes) || '—')
                              : '—'}
                          </td>
                          <td aria-hidden="true"><span className="nx-arrow">→</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---------- Per-student analytics panel ---------- */}
            {selectedStudent && (
              <section className="nx-panel" aria-label={`Analytics for ${selectedStudent.name}`}>
                <div className="nx-panel-head">
                  <div className="nx-panel-title">
                    <Index n="04">Student</Index>
                    <h2>{selectedStudent.name}</h2>
                    <Chip>{`Grade ${selectedStudent.grade ?? '—'}`}</Chip>
                  </div>
                  <Button size="sm" onClick={() => launch(selectedStudent)}>Launch session</Button>
                </div>

                {detailLoading ? (
                  <p className="nx-note">Loading history and analytics…</p>
                ) : (
                  <div className="nx-panel-grid">
                    {/* Left: strengths, weaknesses, mastery */}
                    <div className="nx-stack nx-gap-md">
                      <div className="nx-stack nx-gap-xs">
                        <Label>Strengths</Label>
                        {(detail?.analytics?.strengths || []).length > 0 ? (
                          <div className="nx-chip-row">
                            {detail.analytics.strengths.map((t, i) => (
                              <Chip key={`${t}-${i}`} tone="resolve">{t}</Chip>
                            ))}
                          </div>
                        ) : <span className="nx-note">No strengths detected yet.</span>}
                      </div>

                      <div className="nx-stack nx-gap-xs">
                        <Label>Weaknesses</Label>
                        {(detail?.analytics?.weaknesses || []).length > 0 ? (
                          <div className="nx-chip-row">
                            {detail.analytics.weaknesses.map((t, i) => (
                              <Chip key={`${t}-${i}`} tone="alert">{t}</Chip>
                            ))}
                          </div>
                        ) : <span className="nx-note">No weaknesses detected yet.</span>}
                      </div>

                      <div className="nx-stack nx-gap-xs">
                        <Label>Topic mastery</Label>
                        {Object.keys(detail?.analytics?.topic_mastery || {}).length > 0 ? (
                          <div className="nx-mastery-list">
                            {Object.entries(detail.analytics.topic_mastery).map(([topic, lvl]) => {
                              const cfg = LEVELS[lvl] || { pct: 0, tone: 'amber' };
                              return (
                                <div key={topic} className="nx-mastery-row">
                                  <span className="nx-mastery-row__name" title={topic}>{topic}</span>
                                  <Meter value={cfg.pct} tone={cfg.tone} />
                                  <span className="nx-mastery__label">{lvl}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="nx-note">Mastery fills in as quizzes complete.</span>
                        )}
                      </div>
                    </div>

                    {/* Right: quiz history + spark */}
                    <div className="nx-stack nx-gap-md">
                      <div className="nx-stack nx-gap-xs">
                        <Label>Recent scores</Label>
                        {detail && detail.quizzes.length >= 2 ? (
                          <div className="nx-spark-block">
                            <Spark points={[...detail.quizzes].reverse().map((q) => Number(q.score) || 0)} />
                            <span className="nx-note">Oldest → latest · last {detail.quizzes.length} sessions</span>
                          </div>
                        ) : (
                          <span className="nx-note">Two sessions or more draw the trend line.</span>
                        )}
                      </div>

                      <div className="nx-stack nx-gap-xs">
                        <Label>Quiz history</Label>
                        {detail && detail.quizzes.length > 0 ? (
                          <div className="nx-table-wrap">
                            <table className="nx-table nx-table--compact">
                              <thead>
                                <tr>
                                  <th scope="col">Subject</th>
                                  <th scope="col">Topic</th>
                                  <th scope="col">Score</th>
                                  <th scope="col">Diff</th>
                                  <th scope="col">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.quizzes.map((q) => (
                                  <tr key={q.id}>
                                    <td>{q.subject}</td>
                                    <td className="nx-quiz-topic">{q.topic}</td>
                                    <td>{`${Number(q.score) || 0}%`}</td>
                                    <td>{q.difficulty}</td>
                                    <td>{fmtDate(q.completed_at)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <span className="nx-note">No quiz sessions recorded yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ---------- COUNCIL VIEW ---------- */}
        {view === 'council' && (
          <div className="nx-shell__body">
            <div className="nx-head">
              <Index n="02">The council</Index>
              <span className="nx-note">The council runs during live sessions; timings appear here per run.</span>
            </div>
            <AgentMonitor title="13 agents · system health" />
          </div>
        )}
      </div>

      {/* ---------- New student modal ---------- */}
      <Modal open={newOpen} onClose={closeForm} title="New student">
        <form className="nx-form" onSubmit={submitStudent} aria-label="Create student profile">
          <Field label="Name" htmlFor="nx-new-name">
            <Input
              id="nx-new-name"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayesha Perera"
            />
          </Field>

          <Field label="Grade" htmlFor="nx-new-grade">
            <Select id="nx-new-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
            </Select>
          </Field>

          <Field label="Age" htmlFor="nx-new-age">
            <Input
              id="nx-new-age"
              type="number"
              min="10"
              max="19"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="14"
            />
          </Field>

          <Field label="Subjects" hint="Tap to select one or more.">
            <div className="nx-toggles">
              {SUBJECTS.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  className={`nx-toggle${picked.includes(subj) ? ' nx-toggle--on' : ''}`}
                  aria-pressed={picked.includes(subj)}
                  onClick={() => toggleSubject(subj)}
                >
                  {subj}
                </button>
              ))}
            </div>
          </Field>

          {formError && <p className="nx-field-error" role="alert">{formError}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create profile'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
