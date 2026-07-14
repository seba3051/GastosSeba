import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { money } from '../lib/format.js';
import { CATEGORICAL } from '../lib/colors.js';
import { Card, Field, Input, Select, Button, Spinner, Empty, Modal } from '../components/ui.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { category?, type }

  function load() {
    setLoading(true);
    api.getCategories().then(setCategories).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm('¿Eliminar la categoría? Los movimientos quedarán "sin categoría".')) return;
    await api.deleteCategory(id);
    load();
  }

  const expense = categories.filter((c) => c.type === 'expense');
  const income = categories.filter((c) => c.type === 'income');

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Categorías</h1>

      <CategoryGroup
        title="Gastos"
        items={expense}
        showBudget
        onAdd={() => setModal({ type: 'expense' })}
        onEdit={(c) => setModal({ category: c, type: 'expense' })}
        onDelete={handleDelete}
      />
      <CategoryGroup
        title="Ingresos"
        items={income}
        onAdd={() => setModal({ type: 'income' })}
        onEdit={(c) => setModal({ category: c, type: 'income' })}
        onDelete={handleDelete}
      />

      {modal && (
        <CategoryModal
          data={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryGroup({ title, items, showBudget, onAdd, onEdit, onDelete }) {
  return (
    <Card
      title={title}
      action={
        <Button variant="ghost" onClick={onAdd}>
          + Agregar
        </Button>
      }
    >
      {items.length === 0 ? (
        <Empty>No hay categorías todavía.</Empty>
      ) : (
        <ul className="divide-y divide-slate-700">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-200">
                <span className="inline-block h-3.5 w-3.5 rounded-sm" style={{ background: c.color }} />
                {c.name}
                {showBudget && c.monthly_budget != null && (
                  <span className="text-xs text-slate-400">· {money(c.monthly_budget)}/mes</span>
                )}
              </span>
              <span>
                <button
                  onClick={() => onEdit(c)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-500/15 hover:text-red-400"
                >
                  🗑️
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CategoryModal({ data, onClose, onSaved }) {
  const editing = Boolean(data.category);
  const [name, setName] = useState(data.category?.name || '');
  const [color, setColor] = useState(data.category?.color || CATEGORICAL[0]);
  const [budget, setBudget] = useState(
    data.category?.monthly_budget != null ? String(data.category.monthly_budget) : ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isExpense = data.type === 'expense';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name,
        type: data.type,
        color,
        monthly_budget: isExpense && budget !== '' ? Number(budget) : null,
      };
      if (editing) await api.updateCategory(data.category.id, payload);
      else await api.createCategory(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${editing ? 'Editar' : 'Nueva'} categoría de ${isExpense ? 'gasto' : 'ingreso'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre">
          <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {CATEGORICAL.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ring-2 ${
                  color === c ? 'ring-white' : 'ring-transparent'
                }`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        {isExpense && (
          <Field label="Presupuesto mensual (opcional)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Sin límite"
            />
          </Field>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
