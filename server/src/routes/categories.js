import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/categories?type=expense|income
router.get('/', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM categories WHERE user_id = ?';
  const params = [req.userId];
  if (type === 'expense' || type === 'income') {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' ORDER BY type, name';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { name, type, color, monthly_budget } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (type !== 'expense' && type !== 'income') {
    return res.status(400).json({ error: 'Tipo inválido' });
  }
  const budget = type === 'expense' && monthly_budget != null ? Number(monthly_budget) : null;
  const info = db
    .prepare(
      'INSERT INTO categories (user_id, name, type, color, monthly_budget) VALUES (?, ?, ?, ?, ?)'
    )
    .run(req.userId, name.trim(), type, color || '#64748b', budget);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const cat = db
    .prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });

  const name = req.body?.name?.trim() || cat.name;
  const color = req.body?.color || cat.color;
  const budget =
    cat.type === 'expense'
      ? req.body?.monthly_budget != null
        ? Number(req.body.monthly_budget)
        : null
      : null;

  db.prepare('UPDATE categories SET name = ?, color = ?, monthly_budget = ? WHERE id = ?').run(
    name,
    color,
    budget,
    cat.id
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(cat.id));
});

router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.status(204).end();
});

export default router;
