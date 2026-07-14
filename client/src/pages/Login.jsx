import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, Input, Button } from '../components/ui.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">💰</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">GastosSeba</h1>
          <p className="text-sm text-slate-400">Controlá tus gastos e ingresos</p>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6 shadow-sm ring-1 ring-slate-700">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-900 p-1">
            {[
              ['login', 'Ingresar'],
              ['register', 'Crear cuenta'],
            ].map(([m, label]) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                className={`rounded-md py-2 text-sm font-medium transition ${
                  mode === m ? 'bg-slate-700 text-brand-300 shadow-sm' : 'text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </Field>
            <Field label="Contraseña">
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </Field>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
