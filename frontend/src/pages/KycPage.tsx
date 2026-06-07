import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { kyc as kycApi, auth, password as pwApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/ui/glass-card';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function KycPage() {
  const { user: authUser } = useAuth();
  const [kycStatus, setKycStatus] = useState('pending');
  const [documents, setDocuments] = useState<any[]>([]);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '', dateOfBirth: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('passport');
  const fileRef = useRef<HTMLInputElement>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [tab, setTab] = useState('profile');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    kycApi.status().then((s) => setKycStatus(s.kycStatus)).catch(() => {});
    kycApi.documents().then(setDocuments).catch(() => {});
    auth.getProfile().then((p) => setProfile({ firstName: p.firstName || '', lastName: p.lastName || '', phone: p.phone || '', dateOfBirth: p.dateOfBirth || '', address: p.address || '' })).catch(() => {});
  }, []);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await kycApi.updateProfile(profile); toast.success('Profile updated'); } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('document', file);
    fd.append('type', docType);
    try {
      await kycApi.upload(fd);
      toast.success('Document uploaded for verification');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      const docs = await kycApi.documents();
      setDocuments(docs);
      const s = await kycApi.status();
      setKycStatus(s.kycStatus);
    } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
  };

  const handleSetup2FA = async () => {
    try {
      const result = await auth.setup2FA();
      setTwoFactorSecret(result.secret);
      setTwoFactorQR(result.qrCode);
      setShow2FA(true);
      toast.success('2FA setup initiated');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleVerify2FA = async () => {
    if (twoFactorToken.length !== 6 || !authUser?.id) return;
    try {
      await auth.verify2FA(authUser.id, twoFactorToken);
      toast.success('2FA enabled!');
      setShow2FA(false);
      setTwoFactorSecret(''); setTwoFactorQR(''); setTwoFactorToken('');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Enter your 2FA code to disable:');
    if (!code || code.length !== 6) return;
    try { await auth.disable2FA(code); toast.success('2FA disabled'); } catch (err: any) { toast.error(err.message); }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      await pwApi.change(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { toast.error(err.message); } finally { setChangingPw(false); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Profile & Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Manage your account</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-1 pb-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {['profile', 'kyc', 'security'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-all ${tab === t ? 'text-blue-400 border border-b-transparent' : ''}`} style={tab === t ? { background: 'var(--input-bg)', borderColor: 'var(--border)' } : { color: 'var(--text-muted)' }}>
            {t === 'profile' ? 'Personal Info' : t === 'kyc' ? 'KYC Verification' : 'Security'}
          </button>
        ))}
      </motion.div>

      {tab === 'profile' && (
        <motion.div variants={item}>
          <GlassCard>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>First Name</label>
                  <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Last Name</label>
                  <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Phone</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Date of Birth</label>
                <input type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Address</label>
                <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} rows={2} />
              </div>
              <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">{saving ? 'Saving...' : 'Save Changes'}</motion.button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      {tab === 'kyc' && (
        <motion.div variants={item}>
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Verification Status</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-medium ${
                kycStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                kycStatus === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${kycStatus === 'approved' ? 'bg-emerald-500' : kycStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Document Type</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
                  <option value="passport" className="bg-[#0a0e1a]">Passport</option>
                  <option value="drivers_license" className="bg-[#0a0e1a]">Driver's License</option>
                  <option value="national_id" className="bg-[#0a0e1a]">National ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Upload Document</label>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:cursor-pointer file:transition-all" style={{ color: 'var(--text-muted)' }} />
              </div>
              <motion.button onClick={handleUpload} disabled={uploading || !file} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">{uploading ? 'Uploading...' : 'Upload for Verification'}</motion.button>
            </div>
            {documents.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Uploaded Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl text-sm" style={{ background: 'var(--input-bg)' }}>
                      <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{doc.type.replace('_', ' ')}</span>
                      <span className={`text-xs font-medium ${doc.status === 'approved' ? 'text-emerald-400' : doc.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{doc.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {tab === 'security' && (
        <motion.div variants={item} className="space-y-6">
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Current Password</label>
                <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>New Password</label>
                <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm New Password</label>
                <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} required minLength={8} />
              </div>
              <motion.button type="submit" disabled={changingPw} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">{changingPw ? 'Changing...' : 'Change Password'}</motion.button>
            </form>
          </GlassCard>

          <GlassCard>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h2>
            {authUser?.twoFactorEnabled ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm text-emerald-400 font-medium">2FA is enabled</span>
                </div>
                <button onClick={handleDisable2FA} className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/20 transition-all">Disable 2FA</button>
              </div>
            ) : !show2FA ? (
              <motion.button onClick={handleSetup2FA} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25">Setup 2FA</motion.button>
            ) : (
              <div className="space-y-4 max-w-md">
                {twoFactorQR && (
                  <div className="flex justify-center">
                    <img src={twoFactorQR} alt="2FA QR Code" className="w-48 h-48 rounded-xl" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }} />
                  </div>
                )}
                <div className="p-3 rounded-xl" style={{ background: 'var(--input-bg)' }}>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Or enter manually:</p>
                  <p className="text-xs font-mono p-2 rounded break-all select-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{twoFactorSecret}</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Scan with Google Authenticator, Authy, etc.</p>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Verify Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={twoFactorToken} onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-4 py-3 rounded-xl text-sm text-center tracking-widest focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} placeholder="000000" maxLength={6} />
                    <motion.button onClick={handleVerify2FA} disabled={twoFactorToken.length !== 6} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 transition-all">Verify</motion.button>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
