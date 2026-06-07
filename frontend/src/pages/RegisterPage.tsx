import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { auth } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { ApexLogo } from '../components/Icons';

function FloatingInput({ label, type, value, onChange, icon }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative group">
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200" style={{ color: focused ? '#3b82f6' : 'var(--text-muted)' }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-4 py-4 rounded-2xl transition-all duration-300 outline-none"
          style={{
            background: 'var(--input-bg)',
            border: '1.5px solid',
            borderColor: focused ? 'rgba(59,130,246,0.5)' : 'var(--input-border)',
            color: 'var(--text-primary)',
            paddingLeft: icon ? '44px' : '16px',
            boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.1), 0 0 30px rgba(59,130,246,0.04)' : 'none',
          }}
          placeholder={label}
          required
        />
      </div>
      <div
        className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full transition-all duration-500"
        style={{
          background: focused ? 'linear-gradient(90deg, transparent, #3b82f6, transparent)' : 'transparent',
          opacity: focused ? 0.6 : 0,
          filter: focused ? 'blur(2px)' : 'none',
        }}
      />
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await auth.register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined });
      login(result.token, result.user);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) { toast.error(err.message || 'Registration failed'); } finally { setLoading(false); }
  };

  const setField = (field: string) => (v: string) => setForm(prev => ({ ...prev, [field]: v }));

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient orbs */}
      <div className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] rounded-full" style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 60%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[5%] right-[10%] w-[35rem] h-[35rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 60%)', filter: 'blur(100px)' }} />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.6) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      {/* Geometric shapes */}
      <motion.div className="absolute top-[15%] right-[10%] w-40 h-40 pointer-events-none" initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 0.3, rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="30" stroke="rgba(59,130,246,0.1)" strokeWidth="0.3" />
        </svg>
      </motion.div>

      <motion.div className="absolute bottom-[20%] left-[8%] w-24 h-24 pointer-events-none" initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 0.2, rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
          <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" stroke="rgba(59,130,246,0.15)" strokeWidth="0.5" fill="rgba(59,130,246,0.02)" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <ApexLogo size={56} />
              <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(59,130,246,0.15)', filter: 'blur(16px)', transform: 'scale(1.3)' }} />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>APEX</h1>
          <p className="text-xs font-semibold tracking-[4px] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>Banking</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: '1000px' }}
        >
          <div
            className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px) saturate(1.5)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            <div className="absolute -top-px left-10 right-10 h-[2px] rounded-full pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), rgba(96,165,250,0.3), transparent)', filter: 'blur(2px)' }} />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(59,130,246,0.03) 50%, transparent 60%)', backgroundSize: '200% 200%', animation: 'shimmer 4s linear infinite' }} />
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Get started</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create your account</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FloatingInput label="First name" type="text" value={form.firstName} onChange={setField('firstName')} />
                  <FloatingInput label="Last name" type="text" value={form.lastName} onChange={setField('lastName')} />
                </div>
                <FloatingInput
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={setField('email')}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <FloatingInput
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={setField('phone')}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <FloatingInput
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={setField('password')}
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />
                  <FloatingInput
                    label="Confirm"
                    type="password"
                    value={form.confirmPassword}
                    onChange={setField('confirmPassword')}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-4 rounded-2xl font-semibold text-sm overflow-hidden group transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)',
                    boxShadow: '0 4px 24px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.2)',
                    color: '#fff',
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none shimmer-slide" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
                  <span className="relative z-10">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account...
                      </span>
                    ) : 'Create Account'}
                  </span>
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-medium transition-colors" style={{ color: '#3b82f6' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
