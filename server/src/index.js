import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import transactionRoutes from './routes/transactions.js';
import reportRoutes from './routes/reports.js';
import { authRequired } from './middleware/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', authRequired, categoryRoutes);
app.use('/api/transactions', authRequired, transactionRoutes);
app.use('/api/reports', authRequired, reportRoutes);

// Manejo de errores centralizado.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
