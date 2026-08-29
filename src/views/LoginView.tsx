import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { SEEDED_USERS } from '../lib/mocks/seedData';
import { Train, Key, ArrowRight, Sparkles } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { setCurrentUser, setCurrentRoute } = useStore();
  const [totp, setTotp] = useState('');
  const [step, setStep] = useState<'PASSWORD' | 'TOTP'>('PASSWORD');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'PASSWORD') {
      setStep('TOTP');
    } else {
      setCurrentRoute('/dashboard');
    }
  };

  const loginAsDemo = (userId: string) => {
    const u = SEEDED_USERS.find((usr) => usr.id === userId);
    if (u) {
      setCurrentUser(u);
      setCurrentRoute('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
    }}>
      {/* Subtle grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(to right, rgba(180,83,9,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(180,83,9,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
      }} />

      <div className="anim-fade-up" style={{
        maxWidth: 960, width: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1.2fr',
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(124,61,18,0.14), 0 4px 12px rgba(0,0,0,0.08)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Left — Branding panel */}
        <div style={{
          background: 'var(--amber-900)',
          padding: '44px 36px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background track SVG decoration */}
          <svg style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.08 }} width="240" height="240" viewBox="0 0 240 240">
            <path d="M0 200 Q80 120 160 100 T240 40" stroke="#fff" strokeWidth="2" fill="none" />
            <path d="M0 220 Q80 140 160 120 T240 60" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="80" cy="158" r="6" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="160" cy="112" r="6" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="220" cy="52" r="4" stroke="#fff" strokeWidth="1.5" fill="none" />
          </svg>

          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                background: '#ffffff',
                padding: '6px 12px',
                borderRadius: 14,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src="/logo.png" 
                  alt="RailSync Logo" 
                  style={{ height: 48, objectFit: 'contain' }} 
                />
              </div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 24px', lineHeight: 1.6 }}>
              Ministry of Railways · Government of India<br />
              Smart India Hackathon 2026 — Problem #26027
            </p>

            {/* AI Consolidation visual */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '16px 18px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Sparkles size={14} color="#FCD34D" />
                <span style={{ color: '#FCD34D', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  AI Consolidation Engine
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)',
                }}>
                  <span>Legacy: 3 Dept Blocks</span>
                  <span>8.5h Downtime</span>
                </div>
                <div style={{
                  background: 'rgba(252,211,77,0.18)', borderRadius: 8, padding: '8px 12px',
                  border: '1px solid rgba(252,211,77,0.35)',
                  display: 'flex', justifyContent: 'space-between',
                  color: '#FCD34D', fontWeight: 700,
                }}>
                  <span>AABPS: 1 Combined</span>
                  <span>3.5h (−37%)</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 24 }}>
            Secure Railway Intranet · RailNet Gateway
          </div>
        </div>

        {/* Right — Login form & All 9 Personas */}
        <div style={{ background: '#fff', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Officer Portal Sign In
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {step === 'PASSWORD' ? 'Enter your RailNet credentials to continue' : 'Step 2 — Enter your 6-digit TOTP code'}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {step === 'PASSWORD' ? (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    RailNet ID / Email
                  </label>
                  <input
                    type="text"
                    defaultValue="rajesh.sharma@railnet.gov.in"
                    className="warm-input font-mono"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Password
                  </label>
                  <input type="password" defaultValue="••••••••••••" className="warm-input" style={{ padding: '8px 12px', fontSize: 13 }} />
                </div>
              </>
            ) : (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Key size={13} color="var(--amber-700)" />
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  placeholder="e.g. 849201"
                  className="warm-input font-mono"
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: '0.3em', fontWeight: 700, color: 'var(--amber-700)', padding: '8px' }}
                />
              </div>
            )}
            <button type="submit" className="btn-amber" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13 }}>
              <span>{step === 'PASSWORD' ? 'Next: Verify TOTP' : 'Authenticate & Open Dashboard'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* ALL 9 RBAC PERSONAS */}
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: 'var(--amber-700)',
              textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10,
            }}>
              ⚡ 1-CLICK SIH JUDGE DEMO PERSONAS (ALL 9 RBAC ROLES):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 2 }}>
              {SEEDED_USERS.map((usr) => (
                <button
                  key={usr.id}
                  type="button"
                  onClick={() => loginAsDemo(usr.id)}
                  style={{
                    background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
                    borderRadius: 10, padding: '8px 10px', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--amber-700)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-soft)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)';
                  }}
                >
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 11, color: 'var(--amber-900)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {usr.name}
                  </span>
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {usr.role.replace(/_/g, ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
