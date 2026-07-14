import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import TransactionForm from './TransactionForm.jsx';

const NAV = [
  { to: '/', label: 'Panel', icon: '📊', end: true },
  { to: '/movimientos', label: 'Movimientos', icon: '💸' },
  { to: '/categorias', label: 'Categorías', icon: '🏷️' },
  { to: '/reportes', label: 'Reportes', icon: '📈' },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() {
    setFormOpen(false);
    // Fuerza recarga de datos en la página actual.
    setRefreshKey((k) => k + 1);
    window.dispatchEvent(new Event('tx-changed'));
  }

  return (
    <div className="min-h-screen">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="text-lg font-bold text-slate-100">GastosSeba</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
            >
              + Movimiento
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-slate-800"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Navegación (scroll horizontal en móvil) */}
        <nav className="mx-auto max-w-5xl overflow-x-auto px-2">
          <ul className="flex gap-1 pb-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-300'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main key={refreshKey} className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
