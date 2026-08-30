import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { Key, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

const DEMO_PERSONAS = [
  { role: 'SUPER_ADMIN', name: 'Rajesh Kumar', label: 'SUPER ADMIN' },
  { role: 'ZONAL_ADMIN', name: 'Priya Sharma', label: 'ZONAL ADMIN' },
  { role: 'DIVISIONAL_BLOCK_PLANNER', name: 'Vikram Singh', label: 'DIV. PLANNER' },
  { role: 'SENIOR_OFFICER', name: 'Dr. Anand Rao', label: 'SENIOR OFFICER' },
  { role: 'SSE_ENGINEERING', name: 'Suresh Patil', label: 'SSE ENGG' },
  { role: 'SSE_SIGNAL_TELECOM', name: 'Meena Iyer', label: 'SSE S&T' },
  { role: 'SSE_TRACTION_DISTRIBUTION', name: 'Ramesh Gupta', label: 'SSE TD' },
  { role: 'JUNIOR_ENGINEER', name: 'Amit Jadhav', label: 'JR. ENGINEER' },
  { role: 'READ_ONLY_VIEWER', name: 'Kavita Desai', label: 'VIEWER' },
];

export const LoginView: React.FC = () => {
  const { login, demoLogin, loading, error } = useStore();
  const [email, setEmail] = useState('planner@cr.railways.gov.in');
  const [password, setPassword] = useState('demo1234');
  const [totp, setTotp] = useState('');
  const [step, setStep] = useState<'PASSWORD' | 'TOTP'>('PASSWORD');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'PASSWORD') {
      setStep('TOTP');
      return;
    }
    try {
      setLoginError('');
      await login(email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoginError('');
    await demoLogin(role);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative',
    }}>
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
        {/* Left — Branding */}
        <div style={{
          background: 'var(--amber-900)', padding: '44px 36px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          <svg style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.08 }} width="240" height="240" viewBox="0 0 240 240">
            <path d="M0 200 Q80 120 160 100 T240 40" stroke="#fff" strokeWidth="2" fill="none" />
            <path d="M0 220 Q80 140 160 120 T240 60" stroke="#fff" strokeWidth="2" fill="none" />
          </svg>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#fff', padding: '6px 12px', borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <img src="/logo.png" alt="RailSync" style={{ height: 48, objectFit: 'contain' }} />
              </div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 24px', lineHeight: 1.6 }}>
              Ministry of Railways · Government of India<br />
              Smart India Hackathon 2026 — Problem #26027
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 18px',
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
                  display: 'flex', justifyContent: 'space-between', color: '#FCD34D', fontWeight: 700,
                }}>
                  <span>RailSync: 1 Combined</span>
                  <span>3.5h (-37%)</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 24 }}>
            Powered by OR-Tools CP-SAT Solver · Backend Connected
          </div>
        </div>

        {/* Right — Login form + Personas */}
        <div style={{ background: '#fff', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Officer Portal Sign In
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {step === 'PASSWORD' ? 'Enter your RailNet credentials to continue' : 'Step 2 — Enter your 6-digit TOTP code'}
            </p>
          </div>

          {(loginError || error) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 12px' }}>
              <AlertCircle size={14} color="#DC2626" />
              <span style={{ fontSize: 12, color: '#DC2626' }}>{loginError || error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {step === 'PASSWORD' ? (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    RailNet ID / Email
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="warm-input font-mono"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="warm-input"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                  />
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
            <button
              type="submit"
              className="btn-amber"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13, opacity: loading ? 0.6 : 1 }}
            >
              <span>{loading ? 'Authenticating...' : step === 'PASSWORD' ? 'Next: Verify TOTP' : 'Authenticate & Open Dashboard'}</span>
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Demo Personas */}
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: 'var(--amber-700)',
              textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10,
            }}>
              1-CLICK SIH JUDGE DEMO PERSONAS (ALL 9 RBAC ROLES):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 2 }}>
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleDemoLogin(p.role)}
                  disabled={loading}
                  style={{
                    background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
                    borderRadius: 10, padding: '8px 10px', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.15s', opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--amber-700)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
                >
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 11, color: 'var(--amber-900)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </span>
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.label}
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
