import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const demoAccounts = [
    {
      role: 'Store Officer',
      email: 'store@gbu.demo',
      pw: 'demo123',
      dept: 'Stores & Purchase',
      desc: 'Stock ledger, material issues, PO generation, goods inward (GRN), and write-off proposals.',
    },
    {
      role: 'Director (S&P)',
      email: 'director@gbu.demo',
      pw: 'demo123',
      dept: 'Stores & Purchase',
      desc: 'Requisition approvals, write-off sanctions, PO review, and audit log inspection.',
    },
    {
      role: 'Department Staff',
      email: 'dept@gbu.demo',
      pw: 'demo123',
      dept: 'School of ICT',
      desc: 'Raise departmental material requisitions and track approval status.',
    },
    {
      role: 'System Admin',
      email: 'admin@gbu.demo',
      pw: 'demo123',
      dept: 'IT Cell',
      desc: 'Master administration, user management, and system governance.',
    },
  ];

  // Detect Render free tier cold-start
  useEffect(() => {
    const timer = setTimeout(() => setWakingUp(true), 2000);
    api.health()
      .then(() => setWakingUp(false))
      .catch(() => setWakingUp(true))
      .finally(() => clearTimeout(timer));
    return () => clearTimeout(timer);
  }, []);

  const handleFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pw);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const data = await api.login(email, password);
      toast.success(`Signed in as ${data.user.name}`);
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 sm:p-6 lg:p-8 text-ink">
      <div className="max-w-[1100px] w-full bg-surface border border-line rounded-panel md:shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: University Identity (stacked header on mobile, full-height blue panel on desktop) */}
        <div className="md:col-span-5 bg-primary text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded bg-white text-primary flex items-center justify-center font-black text-[18px] mb-4 md:mb-6 shadow-sm">
              GBU
            </div>
            <h1 className="font-serif text-[22px] sm:text-[26px] md:text-[28px] font-semibold tracking-tight leading-snug text-white">
              Gautam Buddha University
            </h1>
            <p className="font-serif text-[15px] sm:text-[16px] text-blue-100 mt-1">
              Stores & Purchase Department
            </p>
            <p className="hidden md:block text-[13px] text-blue-100/90 mt-4 leading-relaxed">
              Digital stock register, departmental material requisitions, purchase order procurement, and asset condemnation records.
            </p>
          </div>

          <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-blue-400/30 text-[12px] text-blue-200">
            Greater Noida, Uttar Pradesh — 201312
          </div>
        </div>

        {/* Right Column: Sign In Form & Demo Role Selectors */}
        <div className="md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-surface">
          <div>
            <div>
              <h2 className="font-serif text-[22px] font-semibold text-ink">Sign in</h2>
              <div className="w-10 h-0.5 bg-primary mt-2 mb-3" />
              <p className="text-[13px] text-ink-muted">
                Enter your university credentials to access the stores portal.
              </p>
            </div>

            {wakingUp && (
              <div className="mt-3 p-2.5 bg-amber-light border border-amber-border rounded text-[12px] text-amber">
                Waking up the server, this can take up to a minute.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gbu.demo"
                  className="w-full h-10 px-3.5 rounded border border-line bg-surface text-ink text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-ink-subtle transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 rounded border border-line bg-surface text-ink text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-ink-subtle transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-1 bg-primary hover:bg-primary-hover text-white text-[14px] font-medium rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Try a demo role list */}
            <div className="mt-6 pt-5 border-t border-line">
              <span className="text-[13px] font-medium text-ink block mb-2.5">
                Try a demo role
              </span>

              <div className="space-y-2">
                {demoAccounts.map((acc) => {
                  const isSelected = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleFill(acc)}
                      className={`w-full p-3 text-left rounded border transition-colors flex flex-col gap-1 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'border-primary bg-primary-light/60 text-ink ring-1 ring-primary'
                          : 'border-line hover:bg-paper/80 hover:border-slate-300 text-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[13px] text-ink">{acc.role}</span>
                        <span className="text-[11px] font-mono text-ink-muted">{acc.email}</span>
                      </div>
                      <p className="text-[12px] text-ink-muted leading-relaxed">
                        {acc.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="text-[12px] text-ink-muted mt-3">
                All demo accounts use the password <code className="font-mono font-semibold text-ink px-1.5 py-0.5 bg-paper rounded border border-line">demo123</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
