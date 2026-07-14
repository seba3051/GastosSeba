import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { todayISO } from '../lib/format.js';
import { Modal, Field, Input, Select, Button } from './ui.jsx';

const EMPTY = { type: 'expense', amount: '', date: todayISO(), description: '', category_id: '' };

export default function TransactionForm({ open, onClose, onSaved, initial }) {
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Al abrir, resetea el formulario (con valores iniciales si estamos editando).
  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      initial
        ? {
            type: initial.type,
            amount: String(initial.amount),
            date: initial.date,
            description: initial.description || '',
            category_id: initial.category_id ? String(initial.category_id) : '',
          }
        : EMPTY
    );
  }, [open, initial]);

  // Carga categorías del tipo elegido.
  useEffect(() => {
    if (!open) return;
    api
      .getCategories(form.type)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [open, form.type]);

  function update(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        category_id: form.category_id ? Number(form.category_id) : null,
      };
      if (editing) await api.updateTransaction(initial.id, payload);
      else await api.createTransaction(payload);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector gasto / ingreso */}
        <div className="grid grid-cols-2 gap-2">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update({ type: t, category_id: '' })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                form.type === t
                  ? t === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-green-600 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t === 'expense' ? '↓ Gasto' : '↑ Ingreso'}
            </button>
          ))}
        </div>

        <Field label="Monto">
          <Input
            type="number"
            step="0.01"
            min="0"
            required
            autoFocus
            value={form.amount}
            onChange={(e) => update({ amount: e.target.value })}
            placeholder="0.00"
          />
        </Field>

        <Field label="Categoría">
          <Select
            value={form.category_id}
            onChange={(e) => update({ category_id: e.target.value })}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fecha">
          <Input
            type="date"
            required
            value={form.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </Field>

        <Field label="Descripción (opcional)">
          <Input
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Ej: Supermercado"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
