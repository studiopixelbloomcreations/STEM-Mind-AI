import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, ArrowRight, Brain, Activity, Zap, Sparkles, Sun, Moon, Laptop } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login() {
  const { handleLogin, themeSetting, handleThemeChange } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div style={styles.container}>
      {/* Visual background ambient decoration */}
      <div style={styles.glowTop}></div>
      <div style={styles.glowBottom}></div>

      <header style={styles.header}>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoImg} alt="STEMMind AI Logo" style={{ height: '36px', width: 'auto', borderRadius: '4px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>STEM Mind AI</span>
        </div>
        
        {/* Responsive Premium Theme Selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--glass-bg)', padding: '4px 8px', borderRadius: '100px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => handleThemeChange('light')} 
            style={{ border: 'none', background: themeSetting === 'light' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: themeSetting === 'light' ? '#8b5cf6' : 'var(--text-muted)', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Light Mode"
          >
            <Sun size={16} />
          </button>
          <button 
            onClick={() => handleThemeChange('dark')} 
            style={{ border: 'none', background: themeSetting === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: themeSetting === 'dark' ? '#8b5cf6' : 'var(--text-muted)', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Dark Mode"
          >
            <Moon size={16} />
          </button>
          <button 
            onClick={() => handleThemeChange('system')} 
            style={{ border: 'none', background: themeSetting === 'system' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: themeSetting === 'system' ? '#8b5cf6' : 'var(--text-muted)', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="System Theme"
          >
            <Laptop size={16} />
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.heroSection}>
          <div style={styles.badge}>
            <Sparkles size={14} style={{ color: '#06b6d4' }} />
            <span>Harmony Multi-Model Engine v2.0</span>
          </div>
          <h1 style={styles.headline}>
            The Future of <span style={styles.gradientText}>STEM Learning</span>
          </h1>
          <p style={styles.tagline}>
            An advanced cognitive learning platform for Grades 9–11 powered by a collaborative council of specialized AI agents.
          </p>

          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <Zap size={20} style={styles.featureIcon} />
              <div>
                <h3 style={styles.featureTitle}>Adaptive Difficulty AI</h3>
                <p style={styles.featureDesc}>Calibrates challenges to prevent frustration or boredom.</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <Activity size={20} style={styles.featureIcon} />
              <div>
                <h3 style={styles.featureTitle}>Visual Analytics</h3>
                <p style={styles.featureDesc}>Identify student weaknesses and strengths in real time.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.loginCard} className="card-glass glow-pulse">
          <GraduationCap size={48} style={{ color: '#8b5cf6', marginBottom: '16px' }} />
          <h2 style={styles.cardTitle}>Teacher Portal</h2>
          <p style={styles.cardSubtitle}>
            Sign in as an educator to register student profiles, review academic metrics, and track progress.
          </p>

          {error && <div style={styles.errorBanner}>{error}</div>}

          <button
            onClick={onSignIn}
            disabled={loading}
            className="btn-primary"
            style={styles.signInBtn}
          >
            {loading ? (
              <span>Connecting Securely...</span>
            ) : (
              <>
                <span>Sign In with Google</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div style={styles.footerNote}>
            Powered by Firebase Authentication & Supabase.
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 48px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(10px)',
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 80px',
    gap: '64px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    zIndex: 2,
    '@media (max-width: 968px)': {
      flexDirection: 'column',
      padding: '40px 24px',
      textAlign: 'center',
      justifyContent: 'center',
    }
  },
  heroSection: {
    flex: 1.2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    borderRadius: '100px',
    padding: '6px 16px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#06b6d4',
    marginBottom: '24px',
  },
  headline: {
    fontSize: '3.8rem',
    fontWeight: '800',
    lineHeight: '1.1',
    marginBottom: '20px',
    letterSpacing: '-0.03em',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  tagline: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '40px',
    maxWidth: '540px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  featureItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    color: '#8b5cf6',
    background: 'rgba(139, 92, 246, 0.1)',
    padding: '8px',
    borderRadius: '8px',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '4px',
  },
  featureDesc: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  loginCard: {
    flex: 0.8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: '420px',
    width: '100%',
  },
  cardTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '12px',
  },
  cardSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
    lineHeight: '1.5',
  },
  signInBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '14px 28px',
    fontSize: '1rem',
    marginBottom: '24px',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    width: '100%',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },
  footerNote: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  glowTop: {
    position: 'absolute',
    top: '-20%',
    left: '-20%',
    width: '60%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 60%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-25%',
    right: '-20%',
    width: '70%',
    height: '70%',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 60%)',
    zIndex: 1,
    pointerEvents: 'none',
  }
};
