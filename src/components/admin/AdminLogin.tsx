import { useState, type FormEvent } from 'react';
import { Loader2, AlertCircle, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLogin() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(username.trim(), password);
    if (signInError) {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-forest-100">
            <Lock size={28} className="text-forest-600" />
          </div>
          <h1 className="font-serif text-3xl font-light text-forest-800">Admin Dashboard</h1>
          <p className="mt-2 font-sans text-sm text-forest-600">Sign in to manage your site</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-cream-50 p-8 shadow-lg">
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 py-3 pl-10 pr-4 font-sans text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 py-3 pl-10 pr-4 font-sans text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
