import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store/useStore';
import { useTranslation } from '../lib/i18n/translations';
import { api, ApiUser } from '../lib/api';
import { ShieldCheck, UserPlus, X, CheckCircle2 } from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { lang } = useStore();
  const t = useTranslation(lang);

  const [usersList, setUsersList] = useState<ApiUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);

  // Form states for new user
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('SSE_ENGINEERING');
  const [departmentInput, setDepartmentInput] = useState('ENG');
  const [divisionInput, setDivisionInput] = useState('MUMBAI');
  const [zoneInput, setZoneInput] = useState('CR');
  const [sectionsInput, setSectionsInput] = useState('KYN-KSRA, DR-KYN');

  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit form states
  const [editZone, setEditZone] = useState('');
  const [editDivision, setEditDivision] = useState('');
  const [editSections, setEditSections] = useState('');

  useEffect(() => {
    api.users.list()
      .then((users) => {
        setUsersList(users);
        setLoadingUsers(false);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        setLoadingUsers(false);
      });
  }, []);

  useEffect(() => {
    if (editingUser) {
      setEditZone(editingUser.zone || 'CR');
      setEditDivision(editingUser.division || 'MUMBAI');
      setEditSections(editingUser.assigned_sections?.join(', ') || '');
    }
  }, [editingUser]);

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim() || !passwordInput.trim()) return;

    setSubmitting(true);
    try {
      const newUser = await api.users.create({
        name: nameInput.trim(),
        email: emailInput.trim(),
        password: passwordInput.trim(),
        role: roleInput,
        department: departmentInput,
        zone: zoneInput,
        division: divisionInput,
        assigned_sections: sectionsInput.split(',').map(s => s.trim()).filter(Boolean),
      });

      setUsersList([...usersList, newUser]);
      setShowProvisionModal(false);
      setNameInput('');
      setEmailInput('');
      setPasswordInput('');
      setToast(`Successfully provisioned user ${newUser.name}!`);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast(`Error: ${err.message || 'Failed to create user'}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const updatedUser = await api.users.update(editingUser.id, {
        zone: editZone.trim() || 'CR',
        division: editDivision.trim() || 'MUMBAI',
        assigned_sections: editSections.split(',').map(s => s.trim()).filter(Boolean),
      });

      setUsersList(usersList.map(u => u.id === editingUser.id ? updatedUser : u));
      setEditingUser(null);
      setToast(`Updated jurisdiction scope for ${updatedUser.name}!`);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast(`Error: ${err.message || 'Failed to update user'}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && (
        <div style={{
          background: toast.startsWith('Error') ? 'var(--bg-raised)' : 'var(--sage-bg)',
          border: `2px solid ${toast.startsWith('Error') ? 'var(--rail-critical)' : 'var(--sage-border)'}`,
          color: toast.startsWith('Error') ? 'var(--rail-critical)' : 'var(--sage-text)',
          padding: '12px 18px', borderRadius: 12,
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={16} color={toast.startsWith('Error') ? 'var(--rail-critical)' : 'var(--rail-snt)'} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="warm-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
            {t.rbacTitle}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {t.rbacSub}
          </p>
        </div>
        <button
          onClick={() => setShowProvisionModal(true)}
          className="btn-amber"
          style={{ fontSize: 13 }}
        >
          <UserPlus size={15} />
          {t.provisionUser}
        </button>
      </div>

      {/* Users table */}
      <div className="warm-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="warm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['User Name', 'Email & Role', 'Jurisdiction Scope', 'MFA Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 18px', textAlign: 'left', background: 'var(--bg-raised)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading users...
                </td>
              </tr>
            ) : usersList.map((usr) => (
              <tr key={usr.id}
                style={{ borderBottom: '1px solid var(--border-soft)', transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{usr.name}</span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{usr.email}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--amber-700)' }}>{usr.role}</div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{usr.zone} / {usr.division}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{usr.assigned_sections?.join(', ') || 'None'}</div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span className={`chip ${usr.mfa_enabled ? 'chip-sage' : 'chip-muted'}`} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                    <ShieldCheck size={11} /> {usr.mfa_enabled ? t.totpActive : 'MFA Disabled'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <button
                    onClick={() => setEditingUser(usr)}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--rail-eng)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {t.editScope}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {showProvisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="warm-card" style={{ maxWidth: 440, width: '100%', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={18} color="var(--amber-700)" />
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Provision New Railway User</span>
              </div>
              <button onClick={() => setShowProvisionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>
            <form onSubmit={handleProvisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input required type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. Ramesh Kulkarni" className="warm-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
                <input required type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="e.g. ramesh.kulkarni@railnet.gov.in" className="warm-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
                <input required type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="warm-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role</label>
                  <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} className="warm-input">
                    <option value="SSE_ENGINEERING">SSE (Engineering)</option>
                    <option value="SSE_SIGNAL">SSE (Signal)</option>
                    <option value="SSE_TELECOM">SSE (Telecom)</option>
                    <option value="DIVISIONAL_BLOCK_PLANNER">Divisional Planner</option>
                    <option value="SENIOR_OFFICER">Senior Officer (DRM)</option>
                    <option value="JUNIOR_ENGINEER">Field JE</option>
                    <option value="ZONAL_ADMIN">Zonal Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Department</label>
                  <select value={departmentInput} onChange={(e) => setDepartmentInput(e.target.value)} className="warm-input">
                    <option value="ENG">ENG</option>
                    <option value="SNT">SNT</option>
                    <option value="TD">TD</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Zone</label>
                  <input type="text" value={zoneInput} onChange={(e) => setZoneInput(e.target.value)} className="warm-input" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Division</label>
                  <input type="text" value={divisionInput} onChange={(e) => setDivisionInput(e.target.value)} className="warm-input" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Assigned Sections (Comma Separated)</label>
                <input type="text" value={sectionsInput} onChange={(e) => setSectionsInput(e.target.value)} className="warm-input font-mono" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowProvisionModal(false)} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn-amber" style={{ fontSize: 13, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Scope Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="warm-card" style={{ maxWidth: 440, width: '100%', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Edit Jurisdiction Scope: {editingUser.name}</span>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>
            <form onSubmit={handleSaveScope} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Zone</label>
                  <input
                    type="text"
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    className="warm-input font-mono"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Division</label>
                  <input
                    type="text"
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="warm-input font-mono"
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Assigned Sections (Comma Separated)</label>
                <input
                  type="text"
                  value={editSections}
                  onChange={(e) => setEditSections(e.target.value)}
                  className="warm-input font-mono"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn-amber" style={{ fontSize: 13, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Saving...' : 'Save Scope'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
