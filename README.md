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

## Despliegue con Docker / EasyPanel

El repo incluye un `Dockerfile` multi-stage que **compila el frontend y lo sirve desde el
mismo backend Express**, exponiendo un único puerto. Ideal para EasyPanel con la opción
"Dockerfile".

### En EasyPanel

1. Creá un servicio de tipo **App** apuntando a este repositorio Git.
2. Método de build: **Dockerfile** (en la raíz del repo).
3. **Puerto**: `3000` (el que expone el contenedor).
4. **Variables de entorno**:
   - `JWT_SECRET` → un valor largo y aleatorio (importante para producción).
   - `PORT` → `3000` (ya viene por defecto).
   - `DATA_DIR` → `/app/data` (ya viene por defecto).
5. **Volumen persistente**: montá un volumen en `/app/data` para que la base SQLite
   (`finances.db`) sobreviva a los redeploys. **Sin esto, perdés los datos en cada
   despliegue.**

Una vez levantado, la app queda disponible en el dominio que le asignes: el frontend en
`/` y la API en `/api`, mismo origen (no hace falta configurar CORS ni URLs).

### Probar la imagen localmente

```bash
docker build -t gastosseba .
docker run -p 3000:3000 -e JWT_SECRET=cambiame -v gastosseba_data:/app/data gastosseba
# App en http://localhost:3000
```

## Notas

- Base de datos SQLite en `DATA_DIR/finances.db` (por defecto `server/data/` en dev,
  `/app/data/` en el contenedor). Se crea sola; está en `.gitignore`.
- Moneda por defecto: formateo local. Cambiable en `client/src/lib/format.js`.
