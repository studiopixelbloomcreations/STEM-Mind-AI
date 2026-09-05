import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { callAgent } from '../../council/orchestrator.js';
import { nexEngine } from '../../nex/behaviorEngine.js';
import { deriveDirectorAction } from '../../nex/director.js';
import { Button, Chip, Label, Meter, Settle } from '../ui/index.jsx';
import './StudentHub.css';

/* ==========================================================================
   StudentHub — the student's side of NexLearn.
   A calm instrument, not a landing page: pick a subject, pick a topic,
   start the session. The curriculum advisor names topics when the council
   is reachable; when it is not, a curated Sri Lankan syllabus list keeps
   the hub usable — it never dead-ends. Nex stays docked and quiet.
   ========================================================================== */

const Nex = lazy(() => import('../nex/Nex.jsx'));

/* --- Subjects: the four STEM pillars of the Sri Lankan curriculum ------- */

const SUBJECTS = [
  { name: 'Mathematics', code: 'MATH', topicsMapped: 24 },
  { name: 'Science',     code: 'SCI',  topicsMapped: 21 },
  { name: 'Physics',     code: 'PHY',  topicsMapped: 18 },
  { name: 'Chemistry',   code: 'CHEM', topicsMapped: 16 },
];

/* --- Offline topics — real syllabus units, one quiet list per subject ----
   Used when the curriculum advisor is unreachable (proxy unconfigured,
   network down, malformed payload). Grade-appropriate for 9-11. */

const FALLBACK_TOPICS = {
  Mathematics: [
    { topic: 'Quadratic equations',        syllabusReference: 'Grades 10-11 algebra — solving by factorisation and formula' },
    { topic: 'Circle theorems',            syllabusReference: 'Grades 10-11 geometry — angles subtended on the same arc' },
    { topic: 'Trigonometric ratios',       syllabusReference: 'Grades 10-11 trigonometry — sine, cosine, tangent in right triangles' },
    { topic: 'Simultaneous equations',     syllabusReference: 'Grades 10-11 algebra — elimination and substitution methods' },
    { topic: 'Geometric progressions',     syllabusReference: 'Grades 10-11 number patterns — nth term and sum to n terms' },
  ],
  Science: [
    { topic: 'Cells and cell transport',   syllabusReference: 'Grade 9-10 biology — diffusion, osmosis and active transport' },
    { topic: 'Light and reflection',       syllabusReference: 'Grade 9-10 physics — plane mirrors, refraction and lenses' },
    { topic: 'Atomic structure',           syllabusReference: 'Grade 9-10 chemistry — protons, neutrons, electrons and isotopes' },
    { topic: 'Electric circuits',          syllabusReference: 'Grade 9-10 physics — current, voltage, resistance and Ohm\u2019s law' },
    { topic: 'The periodic table',         syllabusReference: 'Grade 9-10 chemistry — groups, periods and periodic trends' },
  ],
  Physics: [
    { topic: 'Newton\u2019s laws of motion',  syllabusReference: 'Grades 10-11 mechanics — force, mass, acceleration' },
    { topic: 'Work, energy and power',     syllabusReference: 'Grades 10-11 mechanics — conservation of energy, efficiency' },
    { topic: 'Waves and sound',            syllabusReference: 'Grades 10-11 waves — frequency, wavelength, wave speed' },
    { topic: 'Static and current electricity', syllabusReference: 'Grades 10-11 electricity — charge, circuits, Ohm\u2019s law' },
    { topic: 'Thermal physics',            syllabusReference: 'Grades 10-11 heat — temperature, specific heat, heat transfer' },
  ],
  Chemistry: [
    { topic: 'Structure and bonding',      syllabusReference: 'Grades 10-11 chemistry — ionic, covalent and metallic bonding' },
    { topic: 'The mole and stoichiometry', syllabusReference: 'Grades 10-11 quantitative chemistry — mole calculations, reacting masses' },
    { topic: 'Rates of reaction',          syllabusReference: 'Grades 10-11 kinetics — factors affecting reaction rate' },
    { topic: 'Acids, bases and salts',    syllabusReference: 'Grades 10-11 chemistry — neutralisation, pH, salt preparation' },
    { topic: 'Electrochemistry',           syllabusReference: 'Grades 10-11 chemistry — electrolysis and electrochemical cells' },
  ],
};

const DIFFICULTIES = [
  { value: 'easy',   label: 'Warm-up' },
  { value: 'medium', label: 'Working' },
  { value: 'hard',   label: 'Stretch' },
];

/* Fixed by design: the session length adapts inside the run, not in setup. */
const ADAPTIVE_COUNT = 5;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const normTopics = (raw, subject) => {
  const list = Array.isArray(raw) ? raw
    : Array.isArray(raw?.topics) ? raw.topics
    : Array.isArray(raw?.suggested) ? raw.suggested
    : [];
  const mapped = list
    .filter((t) => t && typeof t === 'object' && String(t.topic || t.name || '').trim())
    .map((t) => ({
      topic: String(t.topic || t.name).trim(),
      syllabusReference: String(t.syllabusReference || t.syllabus || t.reference || '').trim()
        || `Grade-aligned unit in the Sri Lankan ${subject} syllabus`,
    }));
  return mapped.slice(0, 9);
};

const scoreOf = (topic) => {
  const n = Number(topic?.score);
  return Number.isFinite(n) ? n : null;
};

export default function StudentHub() {
  const {
    activeStudent, setActiveStudent, setActiveGrade,
    activeSubject, setActiveSubject, activeTopic, setActiveTopic,
    activeDifficulty, setActiveDifficulty,
    setCurrentQuiz, setLiveModeActive, getStudentHistoryAndAnalytics,
  } = useApp();

  const [topics, setTopics] = useState(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const name = activeStudent?.name?.trim() || 'student';
  const firstName = name.split(/\s+/)[0];
  const grade = Number(activeStudent?.grade) || 10;

  /* The roster's grade drives the council; keep it in sync on entry. */
  useEffect(() => { setActiveGrade(grade); }, [grade, setActiveGrade]);

  /* Quiet analytics — chips only if there is something to say. */
  useEffect(() => {
    let alive = true;
    getStudentHistoryAndAnalytics?.(activeStudent?.id)
      .then((r) => { if (alive && r?.analytics) setAnalytics(r.analytics); })
      .catch(() => {});
    return () => { alive = false; };
  }, [activeStudent?.id, getStudentHistoryAndAnalytics]);

  /* Subject change -> topic list. The curriculum advisor names topics;
     failure degrades to the curated list, never a dead end. The load runs
     from the selection handler (an event), so no effect sets state. */
  const loadTopics = useCallback(async (subject, gradeNow) => {
    setTopics(null);
    setOffline(false);
    setTopicLoading(true);
    let list = null;
    try {
      const out = await callAgent('curriculum', { subject, grade: gradeNow, task: 'suggest_topics', return: 'json' });
      list = normTopics(out, subject);
    } catch { /* offline / proxy error — degrade below */ }
    const usable = list && list.length ? list : FALLBACK_TOPICS[subject];
    setTopics(usable);
    setOffline(list == null || list.length === 0);
    setTopicLoading(false);
  }, []);

  /* Nex idles on the dock — the greeting-adjacent moment. */
  useEffect(() => {
    nexEngine.dispatch(deriveDirectorAction('session_idle'));
  }, []);

  const pickSubject = useCallback((subject) => {
    if (subject === activeSubject) return;
    setActiveTopic('');
    setActiveSubject(subject);
    loadTopics(subject, grade);
  }, [activeSubject, setActiveSubject, setActiveTopic, loadTopics, grade]);

  const launchSession = useCallback(() => {
    if (!activeSubject || !activeTopic) return;
    nexEngine.dispatch(deriveDirectorAction('teaching_started'));
    setCurrentQuiz({
      subject: activeSubject,
      topic: activeTopic,
      grade,
      difficulty: activeDifficulty,
      studentId: activeStudent?.id,
      startedAt: Date.now(),
    });
  }, [activeSubject, activeTopic, activeDifficulty, grade, activeStudent?.id, setCurrentQuiz]);

  /* Per-subject mastery from the roster's analytics, when present. */
  const topicMastery = useMemo(() => analytics?.topic_mastery || {}, [analytics]);
  const masteryFor = useCallback((subject) => {
    const rows = Object.entries(topicMastery).filter(([t]) => t.toLowerCase().includes(subject.toLowerCase()));
    const levels = { Master: 90, Proficient: 65, Beginning: 25 };
    const picks = rows.map(([, v]) => levels[v]).filter((n) => Number.isFinite(n));
    if (!picks.length) return null;
    return Math.round(picks.reduce((a, b) => a + b, 0) / picks.length);
  }, [topicMastery]);

  const strengths = (analytics?.strengths || []).filter(Boolean).slice(0, 3);
  const weaknesses = (analytics?.weaknesses || []).filter(Boolean).slice(0, 3);

  const ready = Boolean(activeSubject && activeTopic);
  const subjects = SUBJECTS;

  return (
    <div className="hub">
      {/* Nex — docked presence, quiet idle */}
      <div className="nx-dock hub__dock" aria-hidden="true">
        <Suspense fallback={null}>
          <Nex dock speechBubble={activeTopic ? `“${activeTopic}”. Ready when you are.` : 'Pick a topic. I\u2019m right here.'} />
        </Suspense>
      </div>

      {/* Header band */}
      <header className="hub__head">
        <div className="nx-grid hub__band">
          <Settle className="hub__band-in">
            <button type="button" className="hub__exit" onClick={() => setActiveStudent(null)}>
              &larr; Roster
            </button>
            <div className="hub__hello">
              <Label plain>Learning hub</Label>
              <h1 className="hub__h1">{greeting()}, {firstName}.</h1>
              <div className="hub__meta">
                <Chip tone="amber">Grade {grade}</Chip>
                <Chip>{activeSubject ? `${activeSubject} selected` : 'Choose a subject'}</Chip>
                {(strengths.length > 0 || weaknesses.length > 0) && (
                  <span className="hub__metachips">
                    {strengths.slice(0, 2).map((s) => <Chip key={`s-${s}`} tone="resolve">Strong: {s}</Chip>)}
                    {weaknesses.slice(0, 2).map((w) => <Chip key={`w-${w}`} tone="alert">Focus: {w}</Chip>)}
                  </span>
                )}
              </div>
            </div>
          </Settle>
        </div>
      </header>

      <main className="nx-grid hub__main">
        {/* Subjects — large, quiet plates */}
        <Settle className="nx-c-12" delay={60}>
          <div className="hub__sectionhead">
            <Label>Subject</Label>
          </div>
          <div className="hub__plates hub__plates--subject" role="group" aria-label="Choose a subject">
            {subjects.map((s) => {
              const selected = activeSubject === s.name;
              const mastery = masteryFor(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  className="hub__plate"
                  aria-pressed={selected}
                  onClick={() => pickSubject(s.name)}
                >
                  <span className="hub__plate-name">{s.name}</span>
                  <span className="hub__plate-meta">{s.code} · {s.topicsMapped} topics mapped</span>
                  {mastery != null && (
                    <span className="hub__plate-meter">
                      <Meter value={mastery} tone={mastery >= 65 ? 'resolve' : undefined} />
                      <span className="hub__plate-meterlabel">{mastery}% mastery</span>
                    </span>
                  )}
                  {selected && <span className="nx-u-sr"> (selected)</span>}
                </button>
              );
            })}
          </div>
        </Settle>

        {/* Topics — for the chosen subject */}
        {activeSubject && (
          <section className="nx-c-12 hub__topics">
            <div className="hub__sectionhead">
              <Label>Topic{grade ? ` · Grade ${grade}` : ''}</Label>
              {offline && !topicLoading && (
                <span className="hub__offline nx-index">Syllabus list — advisor offline</span>
              )}
            </div>

            {topicLoading ? (
              <div className="hub__plates hub__plates--topic" aria-label="Loading topics">
                {[0, 1, 2].map((i) => <div key={i} className="hub__plate hub__plate--shimmer" aria-hidden="true" />)}
              </div>
            ) : (
              <div className="hub__plates hub__plates--topic" role="group" aria-label={`Choose a ${activeSubject} topic`}>
                {(topics || []).map((t) => {
                  const selected = activeTopic === t.topic;
                  const score = scoreOf(topicMastery[t.topic]);
                  return (
                    <button
                      key={t.topic}
                      type="button"
                      className="hub__plate hub__plate--topic"
                      aria-pressed={selected}
                      onClick={() => setActiveTopic(t.topic)}
                    >
                      <span className="hub__plate-name hub__plate-name--topic">{t.topic}</span>
                      <span className="hub__plate-meta">{t.syllabusReference}</span>
                      {score != null && (
                        <span className="hub__plate-meter">
                          <Meter value={score} />
                          <span className="hub__plate-meterlabel">{score}% mastery</span>
                        </span>
                      )}
                      <span className="hub__plate-begin" aria-hidden="true">begin &rarr;</span>
                      {selected && <span className="nx-u-sr"> (selected)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Session bar */}
      <div className="hub__barwrap">
        <div className="nx-grid">
          <div className="hub__bar">
            <div className="nx-field">
              <label className="nx-field__label" htmlFor="hub-difficulty">Difficulty</label>
              <select
                id="hub-difficulty"
                className="nx-select hub__select"
                value={activeDifficulty}
                onChange={(e) => setActiveDifficulty(e.target.value)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label} · {d.value}</option>
                ))}
              </select>
            </div>
            <span className="hub__qcount nx-index">Adaptive · {ADAPTIVE_COUNT} questions</span>
            <Button variant="primary" disabled={!ready} onClick={launchSession}>
              Begin session
            </Button>
            <Button variant="ghost" onClick={() => setLiveModeActive(true)}>
              Talk to Nex instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
