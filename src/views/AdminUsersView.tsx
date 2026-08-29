import React, { useState } from 'react';
import { SEEDED_USERS } from '../lib/mocks/seedData';
import { useStore } from '../lib/store/useStore';
import { useTranslation } from '../lib/i18n/translations';
import { ShieldCheck, UserPlus, X, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

export const AdminUsersView: React.FC = () => {
  const { lang } = useStore();
  const t = useTranslation(lang);

  const [usersList, setUsersList] = useState<User[]>(SEEDED_USERS);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states for new user
  const [nameInput, setNameInput] = useState('');
  const [designationInput, setDesignationInput] = useState('Divisional Engineer');
  const [roleInput, setRoleInput] = useState('SSE');
  const [divisionInput, setDivisionInput] = useState('MUMBAI');

  const [toast, setToast] = useState<string | null>(null);

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const newUser: User = {
      id: `usr-0${usersList.length + 1}`,
      name: nameInput.trim(),
      email: `${nameInput.toLowerCase().replace(/\s+/g, '.')}@railnet.gov.in`,
      designation: designationInput,
      role: roleInput as any,
      department: 'ENG',
      scope: {
        zone: 'CR',
        division: divisionInput,
        sections: ['KYN-KSRA', 'DR-KYN']
      }
    };

    setUsersList([...usersList, newUser]);
    setShowProvisionModal(false);
    setNameInput('');
    setToast(`Successfully provisioned user ${newUser.name}!`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsersList(usersList.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
    setToast(`Updated jurisdiction scope for ${editingUser.name}!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && (
        <div style={{
          background: 'var(--sage-bg)', border: '2px solid var(--sage-border)',
          color: 'var(--sage-text)', padding: '12px 18px', borderRadius: 12,
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={16} color="var(--rail-snt)" />
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
              {['User Name', 'Designation & Role', 'Jurisdiction Scope', 'MFA Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 18px', textAlign: 'left', background: 'var(--bg-raised)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usersList.map((usr) => (
              <tr key={usr.id}
                style={{ borderBottom: '1px solid var(--border-soft)', transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{usr.name}</span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{usr.designation}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--amber-700)' }}>{usr.role}</div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{usr.scope.zone} / {usr.scope.division}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{usr.scope.sections.join(', ')}</div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span className="chip chip-sage" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                    <ShieldCheck size={11} /> {t.totpActive}
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
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Designation</label>
                <input required type="text" value={designationInput} onChange={(e) => setDesignationInput(e.target.value)} className="warm-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role</label>
                  <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} className="warm-input">
                    <option value="SSE">SSE (Engineering)</option>
                    <option value="DIVISIONAL_BLOCK_PLANNER">Divisional Planner</option>
                    <option value="SENIOR_OFFICER">Senior Officer (DRM)</option>
                    <option value="FIELD_JE">Field JE</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Division</label>
                  <input type="text" value={divisionInput} onChange={(e) => setDivisionInput(e.target.value)} className="warm-input" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowProvisionModal(false)} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
                <button type="submit" className="btn-amber" style={{ fontSize: 13 }}>Provision User</button>
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
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Zone / Division</label>
                <input
                  type="text"
                  value={`${editingUser.scope.zone} / ${editingUser.scope.division}`}
                  onChange={(e) => {
                    const [z, d] = e.target.value.split('/');
                    setEditingUser({ ...editingUser, scope: { ...editingUser.scope, zone: z?.trim() || 'CR', division: d?.trim() || 'MUMBAI' } });
                  }}
                  className="warm-input font-mono"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Assigned Sections (Comma Separated)</label>
                <input
                  type="text"
                  value={editingUser.scope.sections.join(', ')}
                  onChange={(e) => {
                    const secs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setEditingUser({ ...editingUser, scope: { ...editingUser.scope, sections: secs } });
                  }}
                  className="warm-input font-mono"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
                <button type="submit" className="btn-amber" style={{ fontSize: 13 }}>Save Scope</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
