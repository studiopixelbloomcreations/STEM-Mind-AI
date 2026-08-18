import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight, Atom, Beaker, Brain, Sparkles, Star, Sun, Moon, Laptop, Rocket, Telescope,
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import './Login.css';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const SECRET_FACTS = [
  'A teaspoon of a neutron star weighs about a billion tons.',
  'Octopuses have three hearts and blue blood.',
  'Bananas are slightly radioactive — and totally safe to eat.',
  'There are more trees on Earth than stars in the Milky Way.',
  'Honey never spoils. Archaeologists have tasted 3,000-year-old honey.',
  'Your brain uses about 20% of your body’s energy.',
];

const ORBIT_ITEMS = [
  { id: 'atom', label: 'Atom', emoji: '⚛️', fact: 'Everything you can touch is made of atoms.' },
  { id: 'rocket', label: 'Rocket', emoji: '🚀', fact: 'Rockets work by throwing mass backward really fast.' },
  { id: 'dna', label: 'DNA', emoji: '🧬', fact: 'Your DNA could stretch to the sun and back many times.' },
  { id: 'planet', label: 'Planet', emoji: '🪐', fact: 'Saturn would float in a giant bathtub. It is less dense than water.' },
  { id: 'flask', label: 'Flask', emoji: '🧪', fact: 'Water is the only everyday substance that expands when it freezes.' },
  { id: 'star', label: 'Star', emoji: '⭐', fact: 'The Sun is a middle-aged star — about 4.6 billion years old.' },
  { id: 'bot', label: 'Robot', emoji: '🤖', fact: 'AI is just math that gets better when it sees more examples.' },
  { id: 'comet', label: 'Comet', emoji: '☄️', fact: 'Comets are dirty snowballs with glowing tails of gas and dust.' },
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
        ? '🌟 You found every orbit treasure! Secret Lab unlocked.'
        : `${item.emoji} ${item.fact} (${left} left)`);
      if (left === 0) setSecretLab(true);
      return next;
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
        showToast('🕹️ Konami code! The Harmony Council appears in the sky.');
      }
      typedRef.current = (typedRef.current + key).slice(-8);
      if (typedRef.current.includes('stem')) {
        showToast('🧠 STEM mode: Science, Technology, Engineering, Math. You belong here.');
      }
      if (typedRef.current.includes('atom')) {
        collectItem(ORBIT_ITEMS[0]);
      }
      if (typedRef.current.includes('bloom')) {
        setSecretLab(true);
        showToast('🌸 Pixel Bloom secret garden unlocked.');
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf = 0;
    const stars = Array.from({ length: 90 }, () => ({
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
        const px = (star.x + (pointer.x - 0.5) * 0.04 * star.z) * width;
        const py = (star.y + (pointer.y - 0.5) * 0.04 * star.z) * height;
        const glow = 0.35 + Math.sin(frame * 0.03 + star.tw) * 0.25;
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

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next === 5) {
      showToast('👀 The logo is watching. Two more taps...');
    }
    if (next >= 7) {
      setSecretLab(true);
      showToast('🔭 Hidden observatory unlocked. Look up!');
    }
  };

  const orbitStyle = useMemo(
    () => ({
      transform: `rotateX(${(pointer.y - 0.5) * -10}deg) rotateY(${(pointer.x - 0.5) * 14}deg)`,
    }),
    [pointer]
  );

  return (
    <div className={`landing ${secretLab ? 'landing--lab' : ''}`}>
      <canvas ref={canvasRef} className="landing-sky" aria-hidden="true" />
      <div className="landing-aurora" aria-hidden="true" />

      <header className="landing-nav">
        <button type="button" className="landing-brand" onClick={handleLogoClick} title="Tap me a few times...">
          <img src={logoImg} alt="STEM Mind AI" />
          <span>STEM Mind AI</span>
        </button>
        <div className="landing-nav-right">
          <div className="theme-toggle landing-theme">
            <button type="button" className={themeSetting === 'light' ? 'is-on' : ''} onClick={() => handleThemeChange('light')} title="Light Mode"><Sun size={16} /></button>
            <button type="button" className={themeSetting === 'dark' ? 'is-on' : ''} onClick={() => handleThemeChange('dark')} title="Dark Mode"><Moon size={16} /></button>
            <button type="button" className={themeSetting === 'system' ? 'is-on' : ''} onClick={() => handleThemeChange('system')} title="System Theme"><Laptop size={16} /></button>
          </div>
          <a className="landing-skip" href="#teacher-portal">Teacher sign-in</a>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-badge">
              <Sparkles size={14} />
              <span>Gemini Live classroom · Grades 9–11</span>
            </div>
            <h1>
              Learn STEM like you are
              <span> talking to a real teacher.</span>
            </h1>
            <p>
              Voice, camera, quizzes, and worksheet walkthroughs — all powered by Gemini Live.
              Collect the floating treasures, find the hidden eggs, then hand the laptop to your teacher.
            </p>
            <div className="landing-stats">
              <div><strong>{collectedCount}/{ORBIT_ITEMS.length}</strong><span>orbit treasures</span></div>
              <div><strong>Live</strong><span>Gemini voice + vision</span></div>
              <div><strong>SL</strong><span>syllabus-aligned</span></div>
            </div>
            <div className="landing-hints">
              <span>Hint: click the planets</span>
              <span>Hint: type STEM</span>
              <span>Hint: ↑↑↓↓←→←→BA</span>
            </div>
          </div>

          <div className="landing-orbit-wrap" style={orbitStyle}>
            <div className={`landing-core ${allFound ? 'is-complete' : ''}`}>
              <Atom size={36} />
              <small>{allFound ? 'Council online' : 'Tap an orbit'}</small>
            </div>
            {ORBIT_ITEMS.map((item, index) => {
              const found = collected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`landing-orbiter ${found ? 'is-found' : ''}`}
                  style={{ '--i': index, '--total': ORBIT_ITEMS.length }}
                  onClick={() => collectItem(item)}
                  aria-label={`Collect ${item.label}`}
                >
                  <span>{item.emoji}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="landing-play">
          <article className="play-card">
            <Rocket size={22} />
            <h3>Talk it out</h3>
            <p>STEM Live listens, sees your desk, and answers like a patient teacher.</p>
          </article>
          <article className="play-card">
            <Beaker size={22} />
            <h3>Snap a worksheet</h3>
            <p>Photo Analyzer reads the page and walks you through each problem.</p>
          </article>
          <article className="play-card">
            <Brain size={22} />
            <h3>Adaptive quizzes</h3>
            <p>Five live questions that get easier or harder based on how you do.</p>
          </article>
          <article className="play-card">
            <Telescope size={22} />
            <h3>Hidden sky lab</h3>
            <p>Find every orbit treasure — a secret constellation wakes up.</p>
          </article>
        </section>

        <section id="teacher-portal" className="landing-portal card-glass">
          <img src={logoImg} alt="" className="portal-mark" />
          <h2>Teacher Portal</h2>
          <p>Sign in to create student profiles, launch Gemini Live lessons, and track mastery.</p>
          {error ? <div className="landing-error">{error}</div> : null}
          <button type="button" className="btn-primary landing-signin" onClick={onSignIn} disabled={loading}>
            <span>{loading ? 'Connecting securely…' : 'Sign in with Google'}</span>
            <ArrowRight size={18} />
          </button>
          <small>Students play on the landing page. Teachers unlock the classroom.</small>
        </section>
      </main>

      <footer className="landing-foot">
        <button
          type="button"
          className="pixel-egg"
          onClick={() => {
            setSecretLab(true);
            showToast('🌸 You found the Pixel Bloom egg in the footer.');
          }}
        >
          pixel bloom
        </button>
        <span>Made for curious minds · Sri Lankan STEM · Gemini Live</span>
        {secretLab ? (
          <span className="lab-flag"><Star size={14} /> Secret Lab online</span>
        ) : null}
      </footer>

      {toast ? (
        <div className="landing-toast" role="status">
          {toast}
        </div>
      ) : null}

      {secretLab ? (
        <div className="secret-constellation" aria-hidden="true">
          {SECRET_FACTS.slice(0, 4).map((fact, index) => (
            <em key={fact} style={{ '--d': index }}>{fact}</em>
          ))}
        </div>
      ) : null}
    </div>
  );
}
