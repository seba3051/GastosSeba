# GastosSeba

App web responsive para gestionar finanzas personales: registrá **gastos** e **ingresos**
por categoría y sacá reportes (por categoría, evolución mensual, comparativa de periodos,
presupuestos y balance).

- **Frontend:** React + Vite + Tailwind CSS + Recharts
- **Backend:** Node.js + Express + SQLite (better-sqlite3)
- **Auth:** email/contraseña con JWT
- **Uso:** personal (una sola cuenta), con datos aislados por usuario en el esquema

## Requisitos

- Node.js 18 o superior (incluye npm)

## Puesta en marcha

En **dos terminales** distintas:

### 1. Backend

```bash
cd server
cp .env.example .env      # opcional: editar JWT_SECRET / PORT
npm install
npm run dev               # API en http://localhost:3001
```

### 2. Frontend

```bash
cd client
npm install
npm run dev               # App en http://localhost:5173
```

El frontend hace proxy de `/api` al backend (ver `client/vite.config.js`), así que solo
necesitás abrir http://localhost:5173.

## Primer uso

1. Entrá a http://localhost:5173 y registrate con un email y contraseña.
2. Al registrarte se crean categorías por defecto de gasto e ingreso.
3. Cargá movimientos con el botón **+ Movimiento** (elegí gasto o ingreso).
4. Ajustá categorías y presupuestos en la sección **Categorías**.
5. Mirá los **Reportes** para ver gráficos por categoría, evolución mensual, comparativas
   y balance.

## Estructura

```
├── server/     # API Express + SQLite
│   └── src/
│       ├── index.js, db.js, schema.sql
│       ├── middleware/auth.js
│       └── routes/  (auth, categories, transactions, reports)
└── client/     # React + Vite + Tailwind
    └── src/
        ├── api/, context/, components/, pages/
        └── main.jsx, App.jsx
```

## Notas

- Base de datos SQLite en `server/data/finances.db` (se crea sola; está en `.gitignore`).
- Moneda por defecto: formateo local. Cambiable en `client/src/lib/format.js`.
