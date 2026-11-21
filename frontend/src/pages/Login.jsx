import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogIn, Server, Sparkles, Building2, Check, User, AlertCircle } from 'lucide-react';
import { api, setToken, setCurrentUser, getToken } from '../api';
import { useToast } from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'ready' | 'waking'
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const demoAccounts = [
    {
      role: 'Store Officer',
      email: 'store@gbu.demo',
      pw: 'demo123',
      dept: 'Stores & Purchase',
      desc: 'Manage stock, issue items, create POs, receive GRN, request write-offs',
      color: 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
    },
    {
      role: 'Director (S&P)',
      email: 'director@gbu.demo',
      pw: 'demo123',
      dept: 'Stores & Purchase (Approver)',
      desc: 'Sanction indents, approve write-offs, review POs, inspect audit log',
      color: 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-950',
      badge: 'bg-amber-600 text-white',
    },
    {
      role: 'Dept Staff',
      email: 'dept@gbu.demo',
      pw: 'demo123',
      dept: 'School of ICT',
      desc: 'Raise departmental indents and track requisitions status',
      color: 'border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100/70 text-cyan-950',
      badge: 'bg-cyan-600 text-white',
    },
    {
      role: 'System Admin',
      email: 'admin@gbu.demo',
      pw: 'demo123',
      dept: 'IT Cell',
      desc: 'Unrestricted administrative access to all university operations',
      color: 'border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-950',
      badge: 'bg-purple-600 text-white',
    },
  ];

  // Check health on mount to detect Render free-tier cold start
  useEffect(() => {
    let timer = setTimeout(() => {
      setServerStatus('waking');
    }, 2500);

    api.health()
      .then(() => {
        clearTimeout(timer);
        setServerStatus('ready');
      })
      .catch(() => {
        clearTimeout(timer);
        setServerStatus('waking');
      });

    return () => clearTimeout(timer);
  }, []);

  // Quick auto-fill
  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pw);
    toast.info(`Selected ${acc.role} demo account. Click Sign In.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const wakeTimer = setTimeout(() => setWakingUp(true), 2500);

    try {
      const data = await api.login(email, password);
      clearTimeout(wakeTimer);
      toast.success(`Welcome back, ${data.user.name} (${data.user.role})!`);
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      clearTimeout(wakeTimer);
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
      setWakingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gbu-950 via-gbu-900 to-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        {/* University Crest / Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 mb-3 border border-amber-300/40">
          GBU
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Stores & Purchase Portal
        </h1>
        <p className="mt-1 text-sm text-gbu-300 font-medium">
          Gautam Buddha University • Greater Noida, Uttar Pradesh
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        {/* Render Cold-start Wake-up Banner */}
        {(wakingUp || serverStatus === 'waking') && (
          <div className="mb-4 p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-200 text-xs sm:text-sm animate-pulse">
            <Server className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Server is waking up from free-tier standby...</p>
              <p className="text-amber-200/80 text-xs">Render instances spin down after inactivity. Responding in ~25-45 seconds.</p>
            </div>
          </div>
        )}

        {/* Main Login Card */}
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Official University Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. store@gbu.demo"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 focus:ring-2 focus:ring-gbu-600/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Demo: demo123</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 focus:ring-2 focus:ring-gbu-600/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gbu-900 hover:bg-gbu-800 text-white font-bold text-sm tracking-wide shadow-lg shadow-gbu-950/20 hover:shadow-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Walk-In Interview Demo Logins
              </span>
              <span className="text-[11px] text-slate-500">Click any card to auto-fill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className={`text-left p-3 rounded-2xl border transition-all duration-150 relative group ${acc.color} ${
                    email === acc.email ? 'ring-2 ring-gbu-800 border-transparent shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${acc.badge}`}>
                      {acc.role}
                    </span>
                    {email === acc.email && (
                      <Check className="w-4 h-4 text-gbu-800 font-bold" />
                    )}
                  </div>
                  <p className="text-xs font-mono font-semibold text-slate-800 truncate">{acc.email}</p>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-snug">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-center text-xs text-gbu-300">
          Designed for Gautam Buddha University Stores & Purchase Department • Walk-in Interview 2026
        </p>
      </div>
    </div>
  );
}
