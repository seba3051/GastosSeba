import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/reports/summary?from=&to=  → totales ingresos/gastos/balance
router.get('/summary', (req, res) => {
  const { from, to } = req.query;
  const { clause, params } = dateClause(req.userId, from, to);
  const rows = db
    .prepare(
      `SELECT type, COALESCE(SUM(amount), 0) AS total
       FROM transactions ${clause} GROUP BY type`
    )
    .all(...params);

  const income = rows.find((r) => r.type === 'income')?.total || 0;
  const expense = rows.find((r) => r.type === 'expense')?.total || 0;
  res.json({ income, expense, balance: income - expense });
});

// GET /api/reports/by-category?type=expense&from=&to=
router.get('/by-category', (req, res) => {
  const type = req.query.type === 'income' ? 'income' : 'expense';
  const { from, to } = req.query;
  const { clause, params } = dateClause(req.userId, from, to);

  const rows = db
    .prepare(
      `SELECT c.id AS category_id,
              COALESCE(c.name, 'Sin categoría') AS name,
              COALESCE(c.color, '#94a3b8') AS color,
              SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       ${clause} AND t.type = ?
       GROUP BY t.category_id
       ORDER BY total DESC`
    )
    .all(...params, type);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  res.json(
    rows.map((r) => ({
      ...r,
      percent: grandTotal ? Math.round((r.total / grandTotal) * 1000) / 10 : 0,
    }))
  );
});

// GET /api/reports/monthly?year=YYYY  → gastos e ingresos por mes
router.get('/monthly', (req, res) => {
  const year = /^\d{4}$/.test(req.query.year || '')
    ? req.query.year
    : String(new Date().getFullYear());

  const rows = db
    .prepare(
      `SELECT strftime('%m', date) AS month, type, SUM(amount) AS total
       FROM transactions
       WHERE user_id = ? AND strftime('%Y', date) = ?
       GROUP BY month, type`
    )
    .all(req.userId, year);

  const months = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0');
    return { month: mm, income: 0, expense: 0, balance: 0 };
  });
  for (const r of rows) {
    const m = months[Number(r.month) - 1];
    if (m) m[r.type] = r.total;
  }
  for (const m of months) m.balance = m.income - m.expense;

  res.json({ year, months });
});

// GET /api/reports/compare?aFrom&aTo&bFrom&bTo&type=expense
router.get('/compare', (req, res) => {
  const type = req.query.type === 'income' ? 'income' : 'expense';
  const a = byCategoryMap(req.userId, req.query.aFrom, req.query.aTo, type);
  const b = byCategoryMap(req.userId, req.query.bFrom, req.query.bTo, type);

  const names = new Set([...a.keys(), ...b.keys()]);
  const categories = [...names].map((name) => {
    const av = a.get(name) || 0;
    const bv = b.get(name) || 0;
    const diff = bv - av;
    const pct = av ? Math.round((diff / av) * 1000) / 10 : bv ? 100 : 0;
    return { name, periodA: av, periodB: bv, diff, pctChange: pct };
  });
  categories.sort((x, y) => y.periodB - x.periodB);

  const totalA = categories.reduce((s, c) => s + c.periodA, 0);
  const totalB = categories.reduce((s, c) => s + c.periodB, 0);
  res.json({ type, categories, totalA, totalB, diff: totalB - totalA });
});

// GET /api/reports/budgets?month=YYYY-MM  → presupuesto vs gastado por categoría de gasto
router.get('/budgets', (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.month || '')
    ? req.query.month
    : new Date().toISOString().slice(0, 7);

  const rows = db
    .prepare(
      `SELECT c.id AS category_id, c.name, c.color, c.monthly_budget AS budget,
              COALESCE(SUM(t.amount), 0) AS spent
       FROM categories c
       LEFT JOIN transactions t
         ON t.category_id = c.id AND strftime('%Y-%m', t.date) = ?
       WHERE c.user_id = ? AND c.type = 'expense'
       GROUP BY c.id
       ORDER BY c.name`
    )
    .all(month, req.userId);

  res.json(
    rows.map((r) => ({
      ...r,
      remaining: r.budget != null ? r.budget - r.spent : null,
      percent: r.budget ? Math.round((r.spent / r.budget) * 1000) / 10 : null,
    }))
  );
});

function dateClause(userId, from, to) {
  let clause = 'WHERE t.user_id = ?';
  const params = [userId];
  if (from) {
    clause += ' AND t.date >= ?';
    params.push(from);
  }
  if (to) {
    clause += ' AND t.date <= ?';
    params.push(to);
  }
  return { clause, params };
}

function byCategoryMap(userId, from, to, type) {
  let sql = `SELECT COALESCE(c.name, 'Sin categoría') AS name, SUM(t.amount) AS total
             FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
             WHERE t.user_id = ? AND t.type = ?`;
  const params = [userId, type];
  if (from) {
    sql += ' AND t.date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND t.date <= ?';
    params.push(to);
  }
  sql += ' GROUP BY t.category_id';
  const map = new Map();
  for (const r of db.prepare(sql).all(...params)) map.set(r.name, r.total);
  return map;
}

export default router;
