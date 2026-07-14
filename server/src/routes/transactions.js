import { Router } from 'express';
import db from '../db.js';

const router = Router();

const SORT_COLUMNS = { date: 'date', amount: 'amount', created_at: 'created_at' };

// GET /api/transactions?type=&from=&to=&categoryId=&sort=&order=&limit=&offset=
router.get('/', (req, res) => {
  const { type, from, to, categoryId } = req.query;
  const sort = SORT_COLUMNS[req.query.sort] || 'date';
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(Number(req.query.limit) || 500, 1000);
  const offset = Number(req.query.offset) || 0;

  let sql = `
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ?`;
  const params = [req.userId];

  if (type === 'expense' || type === 'income') {
    sql += ' AND t.type = ?';
    params.push(type);
  }
  if (from) {
    sql += ' AND t.date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND t.date <= ?';
    params.push(to);
  }
  if (categoryId) {
    sql += ' AND t.category_id = ?';
    params.push(categoryId);
  }

  sql += ` ORDER BY t.${sort} ${order}, t.id ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  res.json(db.prepare(sql).all(...params));
});

function validateBody(body) {
  const { type, amount, date } = body || {};
  if (type !== 'expense' && type !== 'income') return 'Tipo inválido';
  if (amount == null || isNaN(Number(amount)) || Number(amount) < 0) return 'Monto inválido';
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Fecha inválida (YYYY-MM-DD)';
  return null;
}

router.post('/', (req, res) => {
  const err = validateBody(req.body);
  if (err) return res.status(400).json({ error: err });

  const { type, amount, date, description, category_id } = req.body;

  // La categoría (si viene) debe ser del usuario y del mismo tipo.
  if (category_id != null) {
    const cat = db
      .prepare('SELECT type FROM categories WHERE id = ? AND user_id = ?')
      .get(category_id, req.userId);
    if (!cat) return res.status(400).json({ error: 'Categoría inexistente' });
    if (cat.type !== type)
      return res.status(400).json({ error: 'La categoría no coincide con el tipo del movimiento' });
  }

  const info = db
    .prepare(
      `INSERT INTO transactions (user_id, category_id, type, amount, date, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.userId, category_id ?? null, type, Number(amount), date, (description || '').trim());

  res.status(201).json(getOne(info.lastInsertRowid, req.userId));
});

router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Movimiento no encontrado' });

  const err = validateBody(req.body);
  if (err) return res.status(400).json({ error: err });

  const { type, amount, date, description, category_id } = req.body;
  if (category_id != null) {
    const cat = db
      .prepare('SELECT type FROM categories WHERE id = ? AND user_id = ?')
      .get(category_id, req.userId);
    if (!cat) return res.status(400).json({ error: 'Categoría inexistente' });
    if (cat.type !== type)
      return res.status(400).json({ error: 'La categoría no coincide con el tipo del movimiento' });
  }

  db.prepare(
    `UPDATE transactions SET category_id = ?, type = ?, amount = ?, date = ?, description = ?
     WHERE id = ?`
  ).run(category_id ?? null, type, Number(amount), date, (description || '').trim(), existing.id);

  res.json(getOne(existing.id, req.userId));
});

router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Movimiento no encontrado' });
  res.status(204).end();
});

function getOne(id, userId) {
  return db
    .prepare(
      `SELECT t.*, c.name AS category_name, c.color AS category_color
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ? AND t.user_id = ?`
    )
    .get(id, userId);
}

export default router;
