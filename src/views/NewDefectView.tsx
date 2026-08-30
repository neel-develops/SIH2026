import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { PlusCircle, QrCode, MapPin, CheckCircle2 } from 'lucide-react';

const BLOCK_SECTIONS = [
  'CSTM-BY', 'BY-DR', 'DR-KYN', 'KYN-KSRA', 'KSRA-LNL', 'LNL-PUNE',
];

export const NewDefectView: React.FC = () => {
  const { currentUser, createDefect, setCurrentRoute } = useStore();

  const [dept, setDept] = useState(currentUser?.department || 'ENG');
  const [defectType, setDefectType] = useState('Rail fracture / Weld failure');
  const [assetType, setAssetType] = useState('');
  const [section, setSection] = useState('KYN-KSRA');
  const [kmFrom, setKmFrom] = useState<number>(42.350);
  const [kmTo, setKmTo] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [criticality, setCriticality] = useState('HIGH');
  const [durationHrs, setDurationHrs] = useState<number>(2);
  const [tsr, setTsr] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const handleUseGps = () => {
    setKmFrom(+(42.350 + (Math.random() * 2 - 1)).toFixed(3));
  };

  const handleQrScan = () => {
    setDefectType('Point Machine Failure');
    setAssetType('Point Machine #14B');
    setKmFrom(54.120);
    setSection('KYN-KSRA');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createDefect({
        section,
        km_from: kmFrom,
        km_to: kmTo !== '' ? kmTo : undefined,
        defect_type: defectType,
        asset_type: assetType || undefined,
        description: description || `${defectType} logged via Mobile Field PWA at KM ${kmFrom}`,
        criticality,
        department: dept,
        reported_by: currentUser?.name || undefined,
        requires_tsr: tsr,
        estimated_duration_hrs: durationHrs,
      });

      setSubmittedMsg('Defect submitted successfully to Railway Database!');
    } catch (err: any) {
      setSubmittedMsg(`Error: ${err.message || 'Failed to submit defect'}`);
    } finally {
      setSubmitting(false);
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
          background: submittedMsg.startsWith('Error') ? 'var(--bg-raised)' : 'var(--sage-bg)',
          border: `2px solid ${submittedMsg.startsWith('Error') ? 'var(--rail-critical)' : 'var(--sage-border)'}`,
          color: submittedMsg.startsWith('Error') ? 'var(--rail-critical)' : 'var(--sage-text)',
          padding: '14px 18px', borderRadius: 12,
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle2 size={18} color={submittedMsg.startsWith('Error') ? 'var(--rail-critical)' : 'var(--rail-snt)'} />
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
                onChange={(e) => setDept(e.target.value)}
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
                onChange={(e) => setCriticality(e.target.value)}
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
              Defect Type
            </label>
            <input
              type="text"
              required
              value={defectType}
              onChange={(e) => setDefectType(e.target.value)}
              className="warm-input font-mono"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Asset Type (Optional)
            </label>
            <input
              type="text"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="warm-input font-mono"
              placeholder="e.g. Point Machine, OHE Dropper"
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
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>KM From</label>
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
                value={kmFrom}
                onChange={(e) => setKmFrom(parseFloat(e.target.value))}
                className="warm-input font-mono"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Estimated Maintenance Duration (Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={durationHrs}
              onChange={(e) => setDurationHrs(parseFloat(e.target.value))}
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
            disabled={submitting}
            className="btn-amber"
            style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '12px 0', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Submit Defect to RailSync Database'}
          </button>
        </form>
      </div>
    </div>
  );
};
