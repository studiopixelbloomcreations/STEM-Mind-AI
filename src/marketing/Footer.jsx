import { Mark, Settle } from '../components/ui/index.jsx';

/* ==========================================================================
   Footer — the last typographic moment, not a link dump.
   Big wordmark, one hairline, three quiet link columns, colophon.
   Sits on --ink-950 with a top hairline.
   ========================================================================== */

const COLUMNS = [
  {
    label: 'Product',
    links: [
      { text: 'The tutor', href: '#how-it-works' },
      { text: 'The council', href: '#council' },
      { text: 'For teachers', href: '#teachers' },
    ],
  },
  {
    label: 'Curriculum',
    links: [
      { text: 'Grades 9–11', href: '#top' },
      { text: 'Sri Lankan syllabus', href: '#top' },
    ],
  },
  {
    label: 'Connect',
    links: [
      { text: 'hello@nexlearn.edu', href: 'mailto:hello@nexlearn.edu' },
      { text: 'GitHub', href: 'https://github.com/nexlearn' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="m-footer">
      <div className="nx-grid">
        <Settle className="nx-c-12 m-footer__mark-row">
          <Mark />
        </Settle>

        <Settle delay={90} className="nx-c-12">
          <hr className="nx-rule m-footer__rule" />
        </Settle>

        <Settle delay={180} className="nx-c-12">
          <nav className="m-footer__cols" aria-label="Footer">
            {COLUMNS.map((col) => (
              <div key={col.label} className="m-footer__col">
                <span className="nx-label nx-label--plain m-footer__col-label">{col.label}</span>
                <ul className="m-footer__list">
                  {col.links.map((l) => (
                    <li key={l.text}>
                      <a className="m-footer__link" href={l.href}>{l.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </Settle>

        <Settle delay={280} className="nx-c-12">
          <div className="m-footer__colophon">
            <p className="m-footer__line">NexLearn — built for Grades 9–11. © 2026</p>
            <p className="m-footer__quiet">Made with a council of thirteen.</p>
          </div>
        </Settle>
      </div>
    </footer>
  );
}
