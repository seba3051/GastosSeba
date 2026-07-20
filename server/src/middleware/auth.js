import jwt from 'jsonwebtoken';

// En producción el secreto es obligatorio: con un valor por defecto conocido
// cualquiera podría falsificar un token y acceder a los datos.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error(
    '\nFATAL: falta la variable de entorno JWT_SECRET.\n' +
      'Configurala con un valor largo y aleatorio antes de iniciar la app.\n'
  );
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
