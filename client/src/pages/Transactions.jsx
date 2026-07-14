import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { money, shortDate } from '../lib/format.js';
import { Card, Select, Input, Button, Spinner, Empty } from '../components/ui.jsx';
import TransactionForm from '../components/TransactionForm.jsx';

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', categoryId: '', from: '', to: '' });
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getTransactions({
        type: filters.type,
        categoryId: filters.categoryId,
        from: filters.from,
        to: filters.to,
      })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Recarga cuando se crea un movimiento desde la barra superior.
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('tx-changed', handler);
    return () => window.removeEventListener('tx-changed', handler);
  }, [load]);

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    await api.deleteTransaction(id);
    load();
  }

  function setFilter(patch) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Movimientos</h1>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Select value={filters.type} onChange={(e) => setFilter({ type: e.target.value, categoryId: '' })}>
            <option value="">Todos</option>
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
          </Select>
          <Select value={filters.categoryId} onChange={(e) => setFilter({ categoryId: e.target.value })}>
            <option value="">Toda categoría</option>
            {categories
              .filter((c) => !filters.type || c.type === filters.type)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
          <Input type="date" value={filters.from} onChange={(e) => setFilter({ from: e.target.value })} />
          <Input type="date" value={filters.to} onChange={(e) => setFilter({ to: e.target.value })} />
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty>No hay movimientos con estos filtros.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-2 py-2">Fecha</th>
                  <th className="px-2 py-2">Categoría</th>
                  <th className="px-2 py-2">Descripción</th>
                  <th className="px-2 py-2 text-right">Monto</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-500">
                      {shortDate(t.date)}
                    </td>
                    <td className="px-2 py-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ background: t.category_color || '#94a3b8' }}
                        />
                        {t.category_name || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-600">{t.description || '—'}</td>
                    <td
                      className={`whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '−'}
                      {money(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right">
                      <button
                        onClick={() => setEditing(t)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TransactionForm
        open={Boolean(editing)}
        initial={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}
