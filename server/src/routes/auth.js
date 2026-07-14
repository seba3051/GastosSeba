import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { seedCategories } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Ese email ya está registrado' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email.toLowerCase(), hash);
  const userId = info.lastInsertRowid;
  seedCategories(userId);

  const token = signToken(userId);
  res.status(201).json({ token, user: { id: userId, email: email.toLowerCase() } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const user = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

export default router;
