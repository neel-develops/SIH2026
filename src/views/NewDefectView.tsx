import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { BLOCK_SECTIONS } from '../lib/mocks/seedData';
import { Department, Criticality } from '../types';
import { PlusCircle, QrCode, MapPin, CheckCircle2, WifiOff } from 'lucide-react';

export const NewDefectView: React.FC = () => {
  const { currentUser, networkTier, addDefect, setCurrentRoute } = useStore();

  const [dept, setDept] = useState<Department>(currentUser.department || 'ENG');
  const [assetType, setAssetType] = useState('Rail fracture / Weld failure');
  const [section, setSection] = useState('KYN-KSRA');
  const [kmPost, setKmPost] = useState<number>(42.350);
  const [description, setDescription] = useState('');
  const [criticality, setCriticality] = useState<Criticality>('HIGH');
  const [duration, setDuration] = useState<number>(120);
  const [tsr, setTsr] = useState(false);

  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const handleUseGps = () => {
    setKmPost(+(42.350 + (Math.random() * 2 - 1)).toFixed(3));
  };

  const handleQrScan = () => {
    setAssetType('Point Machine #14B');
    setKmPost(54.120);
    setSection('KYN-KSRA');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDefect({
      source: dept === 'ENG' ? 'TMS' : dept === 'SNT' ? 'SMMS' : 'TDMS',
      department: dept,
      assetType,
      description: description || `${assetType} logged via Mobile Field PWA at KM ${kmPost}`,
      sectionId: 'CSTM-PUNE',
      blockSection: section,
      kmPost,
      lat: 19.44,
      lng: 73.31,
      dueBy: new Date(Date.now() + 86400000).toISOString(),
      estimatedDurationMin: duration,
      criticality,
      tsrImposed: tsr,
      status: 'OPEN',
      reportedBy: currentUser.name
    });

    if (networkTier === 'OFFLINE') {
      setSubmittedMsg('Queued offline — will sync automatically when back online!');
    } else {
      setSubmittedMsg('Defect submitted successfully to Railway Database!');
    }

    setTimeout(() => {
      setSubmittedMsg(null);
      setCurrentRoute('/defects');
    }, 2200);
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {submittedMsg && (
        <div style={{
          background: 'var(--sage-bg)', border: '2px solid var(--sage-border)',
          color: 'var(--sage-text)', padding: '14px 18px', borderRadius: 12,
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle2 size={18} color="var(--rail-snt)" />
          <span>{submittedMsg}</span>
        </div>
      )}

      <div className="warm-card" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PlusCircle size={20} color="var(--amber-700)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Report Field Maintenance Defect
            </h2>
          </div>
          {networkTier === 'OFFLINE' && (
            <span className="chip" style={{ background: 'var(--rail-critical)', color: '#fff', fontSize: 10, border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <WifiOff size={11} /> OFFLINE TRAY
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Scan QR Asset */}
          <button
            type="button"
            onClick={handleQrScan}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: 13, borderColor: 'var(--amber-300)', color: 'var(--amber-700)' }}
          >
            <QrCode size={16} />
            <span>Scan Trackside Asset QR Code (Auto-Prefill)</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Department
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value as Department)}
                className="warm-input font-mono"
              >
                <option value="ENG">ENG (Engineering)</option>
                <option value="SNT">S&T (Signal & Telecom)</option>
                <option value="TD">TD (Traction Distribution)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Severity
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as Criticality)}
                className="warm-input font-mono"
              >
                <option value="CRITICAL">CRITICAL (Emergency)</option>
                <option value="HIGH">HIGH Priority</option>
                <option value="MEDIUM">MEDIUM Priority</option>
                <option value="LOW">LOW Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Asset Type
            </label>
            <input
              type="text"
              required
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="warm-input font-mono"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Block Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="warm-input font-mono"
              >
                {BLOCK_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>KM Post</label>
                <button
                  type="button"
                  onClick={handleUseGps}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--rail-eng)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <MapPin size={11} /> Use GPS
                </button>
              </div>
              <input
                type="number"
                step="0.001"
                required
                value={kmPost}
                onChange={(e) => setKmPost(parseFloat(e.target.value))}
                className="warm-input font-mono"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Estimated Maintenance Duration (Mins)
            </label>
            <input
              type="number"
              step="30"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="warm-input font-mono"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
            <input
              type="checkbox"
              id="tsrCheck"
              checked={tsr}
              onChange={(e) => setTsr(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--rail-critical)', cursor: 'pointer' }}
            />
            <label htmlFor="tsrCheck" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
              Impose Temporary Speed Restriction (TSR Caution Order)
            </label>
          </div>

          <button
            type="submit"
            className="btn-amber"
            style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '12px 0' }}
          >
            {networkTier === 'OFFLINE' ? 'Queue Defect Submission Offline' : 'Submit Defect to AABPS Database'}
          </button>
        </form>
      </div>
    </div>
  );
};
