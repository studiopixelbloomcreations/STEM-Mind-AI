import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight, Atom, Beaker, BookOpen, Brain, Camera, CircuitBoard, Cpu,
  GraduationCap, Laptop, Mic, Moon, Rocket, Sparkles, Star, Sun, Telescope, Wrench,
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import voiceSynthesizer from '../utils/voiceSynthesizer';
const StemAvatar = lazy(() => import('./StemAvatar'));
import './Login.css';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const ORBIT_ITEMS = [
  { id: 'atom', label: 'Atom', emoji: '⚛️', fact: 'Everything you can touch is made of atoms.' },
  { id: 'rocket', label: 'Rocket', emoji: '🚀', fact: 'Rockets work by throwing mass backward really fast.' },
  { id: 'dna', label: 'DNA', emoji: '🧬', fact: 'Your DNA could stretch to the Sun and back many times.' },
  { id: 'planet', label: 'Planet', emoji: '🪐', fact: 'Saturn would float in a giant bathtub.' },
  { id: 'flask', label: 'Flask', emoji: '🧪', fact: 'Water expands when it freezes — that is why ice floats.' },
  { id: 'star', label: 'Star', emoji: '⭐', fact: 'The Sun is a middle-aged star, about 4.6 billion years old.' },
  { id: 'bot', label: 'Robot', emoji: '🤖', fact: 'AI is math that gets better when it sees more examples.' },
  { id: 'comet', label: 'Comet', emoji: '☄️', fact: 'Comets are dirty snowballs with glowing tails.' },
];

const STEM_PILLARS = [
  {
    letter: 'S',
    title: 'Science',
    color: '#38bdf8',
    icon: Beaker,
    text: 'Science is how we ask nature honest questions. Why does ice float? How does a lung pull oxygen from air? In STEM Mind AI, Science is Physics, Chemistry, and Biology for Grades 9–11, aligned to the Sri Lankan school syllabus.',
  },
  {
    letter: 'T',
    title: 'Technology',
    color: '#a78bfa',
    icon: Cpu,
    text: 'Technology is tools that extend a human brain. Cameras, code, circuits, and Gemini Live itself. Students learn Computer Science ideas by talking, snapping worksheets, and watching a live teacher think out loud.',
  },
  {
    letter: 'E',
    title: 'Engineering',
    color: '#22d3ee',
    icon: Wrench,
    text: 'Engineering is building something that must actually work. Bridges, apps, robots, experiments. Stem (our official avatar) is a reminder: design, test, fail kindly, try again.',
  },
  {
    letter: 'M',
    title: 'Mathematics',
    color: '#f472b6',
    icon: CircuitBoard,
    text: 'Mathematics is the language the other three speak. Algebra, geometry, functions, probability. Quizzes adapt when a student is flying — and slow down when a concept still feels foggy.',
  },
];

const FEATURES = [
  { icon: Mic, title: 'STEM Live', text: 'A full-screen Gemini Live tutor. Speak, show an object to the camera, and get a patient spoken explanation grounded in what is actually on the desk.' },
  { icon: Camera, title: 'Photo Analyzer', text: 'Snap a worksheet. Gemini Live reads the page, then Visual Teacher walks each problem with diagrams and voice.' },
  { icon: Brain, title: 'Adaptive quizzes', text: 'Five live questions. Difficulty moves with your real attempt history. Hints, ELI10, and repair steps if you miss one.' },
  { icon: GraduationCap, title: 'Teacher cockpit', text: 'Google sign-in, student profiles, mastery, strengths, weaknesses, and quiz history — so a teacher can see the story, not just a score.' },
  { icon: BookOpen, title: 'Sri Lankan syllabus', text: 'Topics are generated for Grades 9, 10, and 11 against government curriculum expectations — not a random internet quiz.' },
  { icon: Rocket, title: 'Voice lessons', text: 'Every explanation can be heard. Narration is Gemini Live audio, the same living voice as STEM Live.' },
];

const STEPS = [
  { n: '01', title: 'A teacher signs in', text: 'Google Authentication. One classroom, many student profiles. No extra student passwords to lose.' },
  { n: '02', title: 'Pick a learner', text: 'Create Maya, Ahamed, Nethmi… then open the Learning Hub or jump straight into STEM Live.' },
  { n: '03', title: 'Choose a world', text: 'Subject, grade, and five fresh syllabus-aligned topics. Or let Stem pick one.' },
  { n: '04', title: 'Learn out loud', text: 'Quiz, teach-me mode, worksheet camera, or a live conversation. Stem stays with you.' },
];

export default function Login() {
  const { handleLogin, themeSetting, handleThemeChange } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [collected, setCollected] = useState(() => new Set());
  const [logoClicks, setLogoClicks] = useState(0);
  const [secretLab, setSecretLab] = useState(false);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const [scrollP, setScrollP] = useState(0);
  const [mood, setMood] = useState('wave');
  const [talking, setTalking] = useState(false);
  const [caption, setCaption] = useState('Tap me — hi, I am Stem!');
  const [activePillar, setActivePillar] = useState(0);
  const canvasRef = useRef(null);
  const konamiRef = useRef([]);
  const sparksRef = useRef([]);
  const typedRef = useRef('');

  const collectedCount = collected.size;
  const allFound = collectedCount >= ORBIT_ITEMS.length;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const collectItem = (item) => {
    setCollected((prev) => {
      if (prev.has(item.id)) return prev;
      const next = new Set(prev);
      next.add(item.id);
      const left = ORBIT_ITEMS.length - next.size;
      showToast(left === 0
        ? '🌟 Every orbit treasure found. Secret Lab unlocked!'
        : `${item.emoji} ${item.fact} (${left} left)`);
      if (left === 0) setSecretLab(true);
      return next;
    });
  };

  const speakAsStem = (line) => {
    const text = line || 'Hi! I am Stem, your official STEM Mind buddy. Science, Technology, Engineering, and Math — I am here to learn with you.';
    setCaption(text);
    setTalking(true);
    setMood('wave');
    voiceSynthesizer.speak(text, () => {
      setTalking(false);
      setMood(secretLab || allFound ? 'dance' : 'idle');
    });
  };

  const onSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await handleLogin();
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onMove = (event) => {
      setPointer({
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      });
    };
    const onClick = (event) => {
      sparksRef.current.push({
        x: event.clientX,
        y: event.clientY,
        life: 1,
        hue: 190 + Math.random() * 80,
      });
    };
    const onKey = (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      konamiRef.current = [...konamiRef.current, key].slice(-KONAMI.length);
      if (KONAMI.every((step, index) => konamiRef.current[index] === step)) {
        setSecretLab(true);
        setMood('dance');
        showToast('🕹️ Konami! Stem starts dancing.');
        speakAsStem('Whoa! Secret dance unlocked. I love when curious kids find hidden things.');
      }
      typedRef.current = (typedRef.current + key).slice(-8);
      if (typedRef.current.includes('stem')) {
        speakAsStem('You spelled my name! I am Stem. Ready when you are.');
      }
      if (typedRef.current.includes('atom')) collectItem(ORBIT_ITEMS[0]);
      if (typedRef.current.includes('bloom')) {
        setSecretLab(true);
        showToast('🌸 Pixel Bloom garden unlocked.');
      }
    };
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = window.scrollY / max;
      setScrollP(p);
      if (p < 0.12) setMood((m) => (m === 'dance' ? m : 'wave'));
      else if (p < 0.32) setMood((m) => (m === 'dance' ? m : 'walk'));
      else if (p < 0.55) setMood((m) => (m === 'dance' ? m : 'yes'));
      else if (p < 0.78) setMood((m) => (m === 'dance' ? m : 'jump'));
      else setMood((m) => (m === 'dance' ? m : 'idle'));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onClick);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onClick);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      voiceSynthesizer.stop();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf = 0;
    const stars = Array.from({ length: 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.2 + Math.random() * 0.8,
      tw: Math.random() * Math.PI * 2,
    }));
    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      frame += 1;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        const px = (star.x + (pointer.x - 0.5) * 0.05 * star.z) * width;
        const py = (star.y + (pointer.y - 0.5) * 0.05 * star.z) * height;
        const glow = 0.3 + Math.sin(frame * 0.03 + star.tw) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = `rgba(186, 230, 253, ${glow})`;
        ctx.arc(px, py, (1.1 + star.z * 1.8) * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });
      sparksRef.current = sparksRef.current
        .map((spark) => ({ ...spark, life: spark.life - 0.03 }))
        .filter((spark) => spark.life > 0);
      sparksRef.current.forEach((spark) => {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${spark.hue}, 90%, 65%, ${spark.life})`;
        ctx.arc(spark.x * window.devicePixelRatio, spark.y * window.devicePixelRatio, 10 * spark.life * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [pointer.x, pointer.y]);

  const dockStyle = useMemo(() => {
    const side = scrollP < 0.22 || scrollP > 0.82 ? 'right' : scrollP < 0.5 ? 'left' : 'right';
    const lift = 6 + Math.sin(scrollP * Math.PI * 4) * 8;
    return {
      [side]: `${4 + scrollP * 4}vw`,
      left: side === 'left' ? `${3 + (1 - scrollP) * 3}vw` : 'auto',
      right: side === 'right' ? `${3 + scrollP * 3}vw` : 'auto',
      bottom: `${8 + lift}vh`,
      transform: `scale(${1.02 + (1 - scrollP) * 0.08})`,
    };
  }, [scrollP]);

  const orbitStyle = useMemo(
    () => ({ transform: `rotateX(${(pointer.y - 0.5) * -8}deg) rotateY(${(pointer.x - 0.5) * 12}deg)` }),
    [pointer]
  );

  return (
    <div className={`landing ${secretLab ? 'landing--lab' : ''}`}>
      <canvas ref={canvasRef} className="landing-sky" aria-hidden="true" />
      <div className="landing-aurora" aria-hidden="true" />

      <Suspense fallback={null}>
        <StemAvatar
          mood={mood}
          talking={talking}
          dockStyle={dockStyle}
          caption={caption}
          onTap={() => speakAsStem()}
        />
      </Suspense>

      <header className="landing-nav">
        <button
          type="button"
          className="landing-brand"
          onClick={() => {
            const next = logoClicks + 1;
            setLogoClicks(next);
            if (next >= 7) {
              setSecretLab(true);
              speakAsStem('You found the hidden observatory. I see stars in your future.');
            } else if (next === 5) showToast('👀 Two more logo taps...');
          }}
        >
          <img src={logoImg} alt="STEM Mind AI" />
          <span>STEM Mind AI</span>
        </button>
        <nav className="landing-links">
          <a href="#what-is-stem">What is STEM</a>
          <a href="#meet-stem">Meet Stem</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#teacher-portal">Teachers</a>
        </nav>
        <div className="landing-nav-right">
          <div className="theme-toggle landing-theme">
            <button type="button" className={themeSetting === 'light' ? 'is-on' : ''} onClick={() => handleThemeChange('light')} title="Light"><Sun size={16} /></button>
            <button type="button" className={themeSetting === 'dark' ? 'is-on' : ''} onClick={() => handleThemeChange('dark')} title="Dark"><Moon size={16} /></button>
            <button type="button" className={themeSetting === 'system' ? 'is-on' : ''} onClick={() => handleThemeChange('system')} title="System"><Laptop size={16} /></button>
          </div>
          <a className="landing-skip" href="#teacher-portal">Teacher sign-in</a>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-badge">
              <Sparkles size={14} />
              <span>Official mascot · Stem · Gemini Live classroom</span>
            </div>
            <h1>
              Hi. I am Stem.
              <span>Your living STEM teacher.</span>
            </h1>
            <p>
              STEM Mind AI is a Grades 9–11 classroom where a real-time Gemini Live teacher
              talks, sees, and walks you through science like a kind friend — not a worksheet robot.
              Scroll and I will follow you around the page.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn-primary" onClick={() => speakAsStem()}>
                <Mic size={16} /> Let Stem say hi
              </button>
              <a className="btn-secondary" href="#what-is-stem">What is STEM?</a>
            </div>
            <div className="landing-stats">
              <div><strong>{collectedCount}/{ORBIT_ITEMS.length}</strong><span>orbit treasures</span></div>
              <div><strong>Live</strong><span>Gemini voice + vision</span></div>
              <div><strong>9–11</strong><span>Sri Lankan syllabus</span></div>
            </div>
          </div>

          <div className="landing-orbit-wrap" style={orbitStyle}>
            <div className={`landing-core ${allFound ? 'is-complete' : ''}`}>
              <Atom size={36} />
              <small>{allFound ? 'Council online' : 'Tap an orbit'}</small>
            </div>
            {ORBIT_ITEMS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`landing-orbiter ${collected.has(item.id) ? 'is-found' : ''}`}
                style={{ '--i': index, '--total': ORBIT_ITEMS.length }}
                onClick={() => collectItem(item)}
              >
                <span>{item.emoji}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="what-is-stem" className="landing-section">
          <p className="kicker">The four letters</p>
          <h2>STEM is a superpower with four doors.</h2>
          <p className="lede">
            STEM is not a single subject. It is a way of being curious on purpose.
            Science notices. Technology extends. Engineering builds. Mathematics proves.
            Together they let a teenager in Negombo or Jaffna invent something the world has not seen yet.
          </p>
          <div className="pillar-grid">
            {STEM_PILLARS.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <button
                  key={pillar.letter}
                  type="button"
                  className={`pillar ${activePillar === index ? 'is-on' : ''}`}
                  onClick={() => {
                    setActivePillar(index);
                    setMood('yes');
                    speakAsStem(`${pillar.title}! ${pillar.text.split('.')[0]}.`);
                  }}
                >
                  <span className="pillar-letter" style={{ color: pillar.color }}>{pillar.letter}</span>
                  <Icon size={22} />
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section id="meet-stem" className="landing-section meet">
          <p className="kicker">Official avatar</p>
          <h2>Meet Stem — downloaded, not invented.</h2>
          <p className="lede">
            Stem is our official classroom avatar: the expressive three.js / Khronos
            <strong> RobotExpressive </strong>
            model, downloaded as a real GLB (not drawn by us). Stem waves when you arrive,
            walks as you scroll, jumps through features, and talks through Gemini Live.
            Tap Stem anytime. Say hi. Ask what an atom is. Stem is shy until you click.
          </p>
          <ul className="meet-list">
            <li>Scroll — Stem hops from the right side of the sky to the left lab bench.</li>
            <li>Tap — Gemini Live speaks: “Hi, I am Stem.”</li>
            <li>Type STEM — Stem hears their name.</li>
            <li>Konami code — Stem dances. Teachers pretend they did not see it.</li>
          </ul>
        </section>

        <section id="features" className="landing-section">
          <p className="kicker">The classroom</p>
          <h2>Everything a curious brain might need.</h2>
          <div className="feature-grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="feature-card" onMouseEnter={() => setMood('jump')}>
                  <Icon size={22} />
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how" className="landing-section">
          <p className="kicker">How a lesson starts</p>
          <h2>Four quiet steps. Then the magic.</h2>
          <div className="step-row">
            {STEPS.map((step) => (
              <article key={step.n} className="step-card">
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section split">
          <article>
            <Telescope size={22} />
            <h3>For students</h3>
            <p>
              Play on this page. Collect orbit treasures. Talk to Stem.
              When your teacher opens a profile, you get a live tutor who never rolls their eyes.
              Wrong answers become a storyboard, not a red X.
            </p>
          </article>
          <article>
            <GraduationCap size={22} />
            <h3>For teachers</h3>
            <p>
              Sign in with Google. Register each learner. Launch Adaptive Study or STEM Live.
              Review mastery, strengths, and the actual questions they met.
              You stay the human in the room. Stem handles the infinite patience.
            </p>
          </article>
        </section>

        <section id="teacher-portal" className="landing-portal card-glass">
          <img src={logoImg} alt="" className="portal-mark" />
          <h2>Teacher Portal</h2>
          <p>Unlock the classroom. Students already have Stem. You get the keys.</p>
          {error ? <div className="landing-error">{error}</div> : null}
          <button type="button" className="btn-primary landing-signin" onClick={onSignIn} disabled={loading}>
            <span>{loading ? 'Connecting securely…' : 'Sign in with Google'}</span>
            <ArrowRight size={18} />
          </button>
          <small>Firebase Auth · Gemini Live · Supabase records</small>
        </section>
      </main>

      <footer className="landing-foot">
        <button
          type="button"
          className="pixel-egg"
          onClick={() => {
            setSecretLab(true);
            speakAsStem('You found the Pixel Bloom egg. Tiny studio, giant curiosity.');
          }}
        >
          pixel bloom
        </button>
        <span>Avatar: RobotExpressive via three.js examples · CC classroom mascot</span>
        {secretLab ? <span className="lab-flag"><Star size={14} /> Secret Lab online</span> : null}
      </footer>

      {toast ? <div className="landing-toast" role="status">{toast}</div> : null}
    </div>
  );
}
