import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 rounded-2xl mb-4">
            <Layers size={22} className="text-zinc-950" />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-100">Control Tower</h1>
          <p className="text-zinc-500 text-sm mt-1">HaulSync · Logistics Command Center</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@haulsync.local"
                className="input-field" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field pr-10" />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 text-zinc-950 font-semibold py-2.5 rounded-lg hover:bg-amber-400 active:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Hint */}
        <div className="mt-4 card p-3">
          <p className="text-[11px] text-zinc-500 font-medium mb-2">Default credentials</p>
          <div className="space-y-1">
            {[
              ['admin@haulsync.local',      'Admin@1234',  'SUPER_ADMIN'],
              ['ct-manager@haulsync.local', 'CTMgr@1234',  'CT_MANAGER'],
              ['operator@haulsync.local',   'Ops@1234',    'OPERATOR'],
            ].map(([email, pass, role]) => (
              <button key={email} type="button"
                onClick={() => setForm({ email, password: pass })}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left">
                <span className="text-xs text-zinc-400 font-mono">{email}</span>
                <span className="text-[10px] text-zinc-600 badge-zinc px-1.5 py-0.5 rounded">{role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
