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
      desc: 'Stock ledger, material issues, PO generation, goods inward (GRN), write-off proposals.',
    },
    {
      role: 'Director (S&P)',
      email: 'director@gbu.demo',
      pw: 'demo123',
      dept: 'Stores & Purchase',
      desc: 'Requisition approvals, write-off sanctions, PO review, audit log inspection.',
    },
    {
      role: 'Department Staff',
      email: 'dept@gbu.demo',
      pw: 'demo123',
      dept: 'School of ICT',
      desc: 'Raise departmental material requisitions and check status.',
    },
    {
      role: 'System Admin',
      email: 'admin@gbu.demo',
      pw: 'demo123',
      dept: 'IT Cell',
      desc: 'Master administration across all university departments.',
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
      <div className="max-w-4xl w-full bg-surface border border-line rounded-panel shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: University Identity */}
        <div className="p-8 sm:p-10 bg-primary text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded bg-white text-primary flex items-center justify-center font-black text-[18px] mb-6">
              GBU
            </div>
            <h1 className="font-serif text-[24px] sm:text-[28px] font-semibold tracking-tight leading-tight">
              Gautam Buddha University
            </h1>
            <p className="font-serif text-[16px] text-blue-200 mt-1">
              Stores & Purchase Department
            </p>
            <p className="text-[13px] text-blue-100/90 mt-4 leading-relaxed">
              Digital stock register, material requisitions, purchase orders and asset write-offs for university stores.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-blue-400/30 text-[12px] text-blue-200">
            Greater Noida, Uttar Pradesh — 201312
          </div>
        </div>

        {/* Right Column: Login Form & Demo Selectors */}
        <div className="p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <h2 className="font-serif text-[20px] font-semibold text-ink">Sign in</h2>
            <p className="text-[13px] text-ink-muted mt-0.5">
              Enter your university credentials to continue.
            </p>

            {wakingUp && (
              <div className="mt-3 p-2.5 bg-amber-light border border-amber-border rounded text-[12px] text-amber">
                Waking up the server, this can take up to a minute.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gbu.demo"
                  className="w-full h-9 px-3 rounded border border-line text-[14px] outline-none focus:border-primary placeholder:text-ink-subtle"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 px-3 rounded border border-line text-[14px] outline-none focus:border-primary placeholder:text-ink-subtle"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 mt-2 bg-primary hover:bg-primary-hover text-white text-[13px] font-semibold rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Try a role list */}
            <div className="mt-6 pt-5 border-t border-line">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-ink-subtle block mb-2">
                Try a role (one-click fill)
              </span>

              <div className="space-y-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleFill(acc)}
                    className={`w-full p-2 text-left rounded border transition-colors flex items-center justify-between text-[12px] ${
                      email === acc.email
                        ? 'border-primary bg-primary-light text-primary font-medium'
                        : 'border-line hover:bg-paper text-ink'
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{acc.role}</span>
                      <span className="text-[11px] text-ink-muted truncate block max-w-[240px]">
                        {acc.desc}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-ink-subtle shrink-0">
                      demo123
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
