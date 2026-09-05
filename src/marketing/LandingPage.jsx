import { useEffect, useRef, useState } from 'react';
import { Button, Mark } from '../components/ui/index.jsx';
import Hero from './Hero.jsx';
import Narrative from './Narrative.jsx';
import Council from './Council.jsx';
import Proof from './Proof.jsx';
import ForTeachers from './ForTeachers.jsx';
import Access from './Access.jsx';
import Footer from './Footer.jsx';
import './marketing.css';

/* ==========================================================================
   Landing page — assembles the marketing workstreams' sections behind a
   scroll-aware top nav. Nav hides on scroll down, returns on scroll up:
   reading keeps the type, navigation gets out of the way.
   Hero renders Nex lazily inside its own stage; the nav carries only type
   and one action, so nothing heavy mounts above the fold.
   ========================================================================== */

const NAV_LINKS = [
  { label: 'The tutor', href: '#how-it-works' },
  { label: 'The council', href: '#council' },
  { label: 'For teachers', href: '#teachers' },
];

export default function LandingPage() {
  const navRef = useRef(null);
  const lastY = useRef(0);
  const ticking = useRef(false);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Direction + a small threshold so hairline scrolls don't flicker.
        const goingDown = y > lastY.current + 4;
        const goingUp = y < lastY.current - 4;
        lastY.current = y;
        // Never hide at the very top; never hide past the fold's anchor.
        if (y < 80) setNavHidden(false);
        else if (goingDown) setNavHidden(true);
        else if (goingUp) setNavHidden(false);
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <a className="nx-u-sr" href="#main">Skip to content</a>

      <nav
        ref={navRef}
        className={`m-topnav${navHidden ? ' m-topnav--hidden' : ''}`}
        data-hidden={navHidden ? 'true' : 'false'}
      >
        <div className="m-topnav__inner">
          <a href="#top" aria-label="NexLearn — home">
            <Mark small />
          </a>
          <div className="m-topnav__links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} className="m-topnav__link" href={l.href}>{l.label}</a>
            ))}
          </div>
          <Button size="sm" variant="secondary" className="m-topnav__cta" onClick={() => { window.location.hash = 'app'; }}>
            Open the app
          </Button>
        </div>
      </nav>

      <main id="main">
        <Hero />
        <Narrative />
        <Council />
        <Proof />
        <ForTeachers />
        <Access />
      </main>
      <Footer />
    </>
  );
}
