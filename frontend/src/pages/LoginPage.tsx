import { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import { auth } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { ApexLogo } from '../components/Icons';

/* ── Floating geometry ── */
const SHAPES = [
  { type: 'ring', size: 280, x: '15%', y: '20%', duration: 18, delay: 0 },
  { type: 'hex', size: 60, x: '75%', y: '15%', duration: 14, delay: 1 },
  { type: 'dot', size: 12, x: '85%', y: '60%', duration: 10, delay: 0.5 },
  { type: 'ring', size: 160, x: '10%', y: '70%', duration: 22, delay: 2 },
  { type: 'hex', size: 40, x: '60%', y: '80%', duration: 16, delay: 0.8 },
  { type: 'dot', size: 8, x: '25%', y: '35%', duration: 12, delay: 1.5 },
  { type: 'ring', size: 200, x: '55%', y: '25%', duration: 20, delay: 3 },
  { type: 'hex', size: 88, x: '35%', y: '65%', duration: 15, delay: 0.3 },
];

function FloatingShape({ shape }: { shape: typeof SHAPES[0] }) {

  if (shape.type === 'ring') {
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: shape.x, top: shape.y, width: shape.size, height: shape.size }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 360],
        }}
        transition={{
          opacity: { duration: shape.duration / 2, repeat: Infinity, ease: 'easeInOut', delay: shape.delay },
          rotate: { duration: shape.duration, repeat: Infinity, ease: 'linear' },
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="url(#ringGrad)" strokeWidth="0.5" opacity="0.6" />
          <circle cx="50" cy="50" r="35" stroke="url(#ringGrad)" strokeWidth="0.3" opacity="0.3" />
        </svg>
      </motion.div>
    );
  }
  if (shape.type === 'hex') {
    const points = '50,0 93,25 93,75 50,100 7,75 7,25';
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: shape.x, top: shape.y, width: shape.size, height: shape.size }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.15, 0.35, 0.15],
          rotate: [0, -360],
        }}
        transition={{
          opacity: { duration: shape.duration / 2, repeat: Infinity, ease: 'easeInOut', delay: shape.delay },
          rotate: { duration: shape.duration, repeat: Infinity, ease: 'linear' },
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
          <polygon points={points} stroke="rgba(59,130,246,0.25)" strokeWidth="0.5" fill="rgba(59,130,246,0.04)" />
        </svg>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: shape.x, top: shape.y, width: shape.size, height: shape.size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{
          opacity: { duration: shape.duration, repeat: Infinity, ease: 'easeInOut', delay: shape.delay },
          scale: { duration: shape.duration * 0.7, repeat: Infinity, ease: 'easeInOut', delay: shape.delay },
        }}
    />
  );
}

/* ── Grid background ── */
function GridBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full opacity-[0.03]" style={{ filter: 'blur(0.5px)' }}>
        <defs>
          <pattern id="loginGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#loginGrid)" />
      </svg>
    </div>
  );
}

/* ── Floating input ── */
function FloatingInput({ label, type, value, onChange, icon, rightAction }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; rightAction?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

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
        {rightAction && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightAction}
          </div>
        )}
      </div>
      {/* Bottom border glow on focus */}
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Mouse parallax ── */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 30, stiffness: 100 });
  const smoothY = useSpring(mouseY, { damping: 30, stiffness: 100 });

  const handleMouse = useCallback((e: MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [handleMouse]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await auth.login({ email, password });
      if (result.requiresTwoFactor && result.userId) {
        navigate('/2fa', { state: { userId: result.userId, email: result.email } });
        return;
      }
      if (result.token && result.user) {
        login(result.token, result.user);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* SVG defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Background layers */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 40%, var(--accent-light) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 70% 60%, rgba(37,99,235,0.05) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(800px circle at 50% 0%, var(--accent-light) 0%, transparent 60%)' }} />
      <GridBg />

      {/* Ambient orbs */}
      <div className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] rounded-full" style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 60%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[5%] right-[10%] w-[35rem] h-[35rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 60%)', filter: 'blur(100px)' }} />
      <div className="absolute top-[40%] right-[20%] w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 60%)', filter: 'blur(70px)' }} />

      {/* 3D floating shapes */}
      {SHAPES.map((shape, i) => (
        <FloatingShape key={i} shape={shape} />
      ))}

      {/* Content */}
      <div className="relative z-10 w-full max-w-[480px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-10"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-5"
            >
              <div className="relative">
                <ApexLogo size={64} />
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'rgba(59,130,246,0.15)',
                    filter: 'blur(16px)',
                    transform: 'scale(1.3)',
                  }}
                />
              </div>
            </motion.div>
            <h1 className="text-4xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              APEX
            </h1>
            <p className="text-sm font-semibold tracking-[4px] uppercase" style={{ color: 'var(--text-muted)' }}>
              Banking
            </p>
          </motion.div>

          {/* 3D Tilt Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: '1000px' }}
          >
            <motion.div
              className="relative"
              style={{
                rotateX: useTransform(smoothY, (v) => ((v - window.innerHeight / 2) / (window.innerHeight / 2)) * -3),
                rotateY: useTransform(smoothX, (v) => ((v - window.innerWidth / 2) / (window.innerWidth / 2)) * 3),
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Card glow edge */}
              <div
                className="absolute -top-px left-10 right-10 h-[2px] rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), rgba(96,165,250,0.3), transparent)',
                  filter: 'blur(2px)',
                }}
              />

              <div
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px) saturate(1.5)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--glass-shadow)',
                }}
              >
                {/* Inner shimmer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(135deg, transparent 40%, rgba(59,130,246,0.03) 50%, transparent 60%)',
                      backgroundSize: '200% 200%',
                      animation: 'shimmer 4s linear infinite',
                    }}
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-7">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.12)' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your credentials</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <FloatingInput
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>

                    <div>
                      <FloatingInput
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={setPassword}
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        }
                        rightAction={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 rounded-xl transition-all hover:bg-white/5 active:scale-90"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              {showPassword ? (
                                <>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </>
                              ) : (
                                <>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </>
                              )}
                            </svg>
                          </button>
                        }
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <Link to="/forgot-password" className="text-xs font-medium transition-colors hover:underline" style={{ color: 'var(--text-muted)' }}>
                        Forgot password?
                      </Link>
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
                      {/* Button shine */}
                      <div
                        className="absolute inset-0 pointer-events-none shimmer-slide"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        }}
                      />
                      <span className="relative z-10">
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Signing in...
                          </span>
                        ) : 'Sign In'}
                      </span>
                    </motion.button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      New to APEX?{' '}
                      <Link to="/register" className="font-medium transition-colors" style={{ color: '#3b82f6' }}>
                        Create account
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center mt-8 text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Protected by industry-standard encryption
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
