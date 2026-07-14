import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// La ubicación de la base se puede fijar con DATA_DIR (útil para montar un
// volumen persistente en Docker/EasyPanel). Por defecto: server/data.
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'finances.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Categorías creadas al registrar un usuario nuevo.
export const DEFAULT_CATEGORIES = [
  { name: 'Comida', type: 'expense', color: '#ef4444' },
  { name: 'Transporte', type: 'expense', color: '#f59e0b' },
  { name: 'Ocio', type: 'expense', color: '#8b5cf6' },
  { name: 'Hogar', type: 'expense', color: '#0ea5e9' },
  { name: 'Salud', type: 'expense', color: '#10b981' },
  { name: 'Otros gastos', type: 'expense', color: '#64748b' },
  { name: 'Salario', type: 'income', color: '#22c55e' },
  { name: 'Freelance', type: 'income', color: '#14b8a6' },
  { name: 'Otros ingresos', type: 'income', color: '#84cc16' },
];

export function seedCategories(userId) {
  const insert = db.prepare(
    'INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)'
  );
  const tx = db.transaction((cats) => {
    for (const c of cats) insert.run(userId, c.name, c.type, c.color);
  });
  tx(DEFAULT_CATEGORIES);
}

export default db;
