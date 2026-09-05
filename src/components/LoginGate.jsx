import { lazy, Suspense, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Label, Mark, Splash } from './ui/index.jsx';

/* ==========================================================================
   LoginGate — the redesigned teacher entry. Editorial, not a card in the
   middle: the mark large, one display-serif line with POV, a short lede,
   one action. Nex holds the right of the grid while the teacher reads.
   ========================================================================== */

const Nex = lazy(() => import('./nex/Nex.jsx'));

export default function LoginGate() {
  const { handleLogin } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      await handleLogin();
    } catch (err) {
      setError(
        err?.code === 'auth/popup-closed-by-user'
          ? 'Sign-in was cancelled before it finished. Try again when ready.'
          : 'Sign-in could not be completed right now. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nx-gate">
      <div className="nx-gate__inner">
        <div className="nx-gate__copy">
          <Mark />

          <Label>Teacher sign-in · Google</Label>

          <h1 className="nx-gate__headline">
            Your classroom, with its own tutor.
          </h1>

          <p className="nx-gate__lede">
            Sign in to provision student profiles, set the curriculum, and watch
            each session resolve. The council builds every question; Nex teaches
            the ones that go wrong.
          </p>

          {error && <p className="nx-gate__err" role="alert">{error}</p>}

          <Button onClick={onSignIn} disabled={busy}>
            {busy ? 'Opening Google…' : 'Sign in with Google'}
          </Button>

          <p className="nx-gate__foot">
            Teachers sign in to provision students. Students enter sessions
            their teacher starts.
          </p>
        </div>

        <div className="nx-gate__nex" aria-hidden="true">
          <Suspense fallback={<Splash label="Summoning Nex" />}>
            <Nex speechBubble="I'll be here when you're in." />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
