import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { seedCategories } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// El registro está cerrado salvo que (a) no exista ningún usuario todavía
// —para poder crear la cuenta dueña la primera vez o si se pierde la base— o
// (b) se habilite explícitamente con ALLOW_REGISTRATION=true.
function registrationOpen() {
  if (process.env.ALLOW_REGISTRATION === 'true') return true;
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  return count === 0;
}

// Límite simple de intentos de login por IP (anti fuerza bruta).
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

function tooManyAttempts(ip) {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

// Permite al frontend saber si debe mostrar la opción de crear cuenta.
router.get('/status', (req, res) => {
  res.json({ registrationOpen: registrationOpen() });
});

router.post('/register', (req, res) => {
  if (!registrationOpen()) {
    return res.status(403).json({ error: 'El registro está cerrado' });
  }

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
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (tooManyAttempts(ip)) {
    return res
      .status(429)
      .json({ error: 'Demasiados intentos fallidos. Probá de nuevo en unos minutos.' });
  }

  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const user = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    recordFailure(ip);
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  attempts.delete(ip);
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

export default router;
