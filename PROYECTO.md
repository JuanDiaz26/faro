# 🧭 Eje — App personal de control de vida

App web personal (instalable como PWA en celular) para llevar control de **dos áreas críticas que en piloto automático se van de las manos**: las **finanzas** y los **hábitos de vida** (sueño, comida, movimiento, foco diario, uso del celular).

> **La hipótesis del proyecto:** medir lo que pasa es la mitad del cambio. Si no ves "gasté $80k en delivery" o "dormí 4hs promedio esta semana", vivís en piloto automático. **Eje** es el espejo honesto que te obliga a verlo, en menos de 30 segundos por día.

---

## 🗺️ Visión por fases

| Fase | Qué incluye | Cuándo | Estado |
|---|---|---|---|
| **Fase 1 — Finanzas** | Gastos, ingresos, categorías, presupuestos, deudas, gastos fijos. Dashboard con totales del mes. | MVP en 3 días | 🔨 En curso |
| **Espera de validación** | 1-2 semanas usando Fase 1 a diario para confirmar que el flujo de carga te sirve. | Después del deploy | ⏳ |
| **Fase 2 — Vida (Hábitos)** | 5 trackers: sueño, scroll nocturno, comida, movimiento, intención del día. Vista semanal + cruce con finanzas. | Después de la validación | 🧊 Planificada |
| **Fase 3 — Multiusuario / Comunidad** | Login, auth, separación de datos por usuario, eventualmente comparativas anónimas con amigos. | Si Fase 1+2 sostienen uso real 2-3 meses | 🧊 A evaluar |

---

## 🎯 Principios de diseño (válidos para toda la app)

1. **Cargar tiene que ser barato.** Cualquier registro debe tomar menos de 10 segundos. Si lleva más, no se va a usar.
2. **Ver patrones, no enterrar en datos.** La app no es un Excel; es un espejo. Mostrar lo importante en pocas pantallas.
3. **Cero notificaciones agresivas, cero gamificación tóxica.** La app es para el usuario, no para retenerlo como producto. Si un día no se usa, no culpa ni recordatorios molestos.
4. **Cruce finanzas ↔ vida es la joya.** Lo que ninguna otra app hace bien. Vistas semanales/mensuales que muestren los dos lados juntos.
5. **Privacidad primero.** Datos sensibles (plata y hábitos personales). DB local mientras sea single-user; cuando sea multiusuario, encriptación y separación clara.

---

## 🛠️ Stack técnico (compartido por todas las fases)

### Frontend
- **React 18** + **Vite 6** (fijados por compatibilidad con Node 22.3.0)
- **TailwindCSS v3** (PostCSS, estable para shadcn)
- **shadcn/ui** para componentes base
- **Recharts** para gráficos
- **Axios** para llamadas HTTP
- **React Router** para navegación
- **Zustand** para estado global
- **PWA** (manifest.json + service worker básico)

### Backend
- **Node.js + Express**
- **better-sqlite3** (síncrono, perfecto para uso local)
- **cors** + **helmet** (seguridad básica)
- **express-validator** para validar inputs

### Base de datos
- **SQLite** (un solo archivo `finanzas.db`). Cuando se vaya a multiusuario real, migrar a **PostgreSQL**.

### Deploy
- **Frontend**: Vercel
- **Backend + DB**: Railway (con volumen persistente para el `.db`)

---

## 📁 Estructura de carpetas

```
finanzas-app/
├── client/                    # Frontend React
│   ├── public/
│   │   ├── manifest.json     # Config PWA
│   │   └── icons/            # Iconos de la app
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── ui/          # Botones, inputs, cards (shadcn)
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── CategoryPicker.jsx
│   │   │   └── ...
│   │   ├── pages/           # Pantallas principales
│   │   │   ├── Dashboard.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Debts.jsx
│   │   │   ├── Vida.jsx          # Fase 2
│   │   │   └── Settings.jsx
│   │   ├── hooks/           # Custom hooks
│   │   ├── api/             # Funciones Axios
│   │   ├── store/           # Zustand stores
│   │   ├── utils/           # Helpers (formato fechas, montos)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Backend Node
│   ├── routes/               # Endpoints por recurso
│   ├── controllers/          # Lógica de negocio
│   ├── middleware/           # Validaciones, errores
│   ├── db/
│   │   ├── schema.sql
│   │   ├── seed.js
│   │   ├── init.js
│   │   ├── database.js      # Conexión compartida
│   │   └── finanzas.db
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── PROYECTO.md
```

---

# 🟢 Fase 1 — Finanzas (MVP en 3 días)

## 🗃️ Schema (Fase 1)

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL,          -- 'expense' | 'income'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL,          -- 'expense' | 'income' | 'debt_payment'
  payment_method TEXT,         -- 'cash' | 'debit' | 'credit' | 'transfer'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  monthly_limit REAL NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE(category_id, month, year)
);

CREATE TABLE debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  total_amount REAL NOT NULL,
  remaining_amount REAL NOT NULL,
  interest_rate REAL DEFAULT 0,
  minimum_payment REAL DEFAULT 0,
  due_day INTEGER,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fixed_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  due_day INTEGER,
  active BOOLEAN DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  source TEXT NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Categorías iniciales (seed)

```
🍔 Comida           (expense, #FF6B6B)
🍽️ Cenas/Salidas    (expense, #FFA94D)
⛽ Transporte       (expense, #4DABF7)
💪 Salud/Fitness    (expense, #51CF66)
💇 Cuidado personal (expense, #DA77F2)
👕 Ropa             (expense, #FF8787)
📱 Telefonía        (expense, #748FFC)
🏠 Gastos fijos     (expense, #868E96)
🎮 Ocio/Vicios      (expense, #F783AC)
💳 Pago deudas      (expense, #FA5252)
📦 Otros            (expense, #ADB5BD)
💼 Sueldo           (income, #20C997)
💰 Extras           (income, #15AABF)
```

## 🔌 API Endpoints (Fase 1)

### Transactions
- `GET /api/transactions` — lista con filtros (mes, categoría, tipo, método)
- `GET /api/transactions/:id` — detalle
- `POST /api/transactions` — crear
- `PUT /api/transactions/:id` — editar
- `DELETE /api/transactions/:id` — borrar
- `GET /api/transactions/summary` — totales del mes actual

### Categories
- `GET /api/categories` (opcional `?type=expense|income`)
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Budgets
- `GET /api/budgets?month=X&year=Y`
- `POST /api/budgets`
- `PUT /api/budgets/:id`
- `DELETE /api/budgets/:id`
- `GET /api/budgets/status` — gastado vs presupuestado por categoría

### Debts
- `GET /api/debts`
- `POST /api/debts`
- `PUT /api/debts/:id`
- `DELETE /api/debts/:id`
- `POST /api/debts/:id/payment` — registrar pago
- `GET /api/debts/simulator?monthly_payment=X` — proyección

### Fixed Expenses
- `GET /api/fixed-expenses`
- `POST /api/fixed-expenses`
- `PUT /api/fixed-expenses/:id`
- `DELETE /api/fixed-expenses/:id`

### Dashboard
- `GET /api/dashboard` — todo en uno (total gastado, ingresos, balance, top 3 categorías, próximos vencimientos, dinero disponible)

## 📱 Pantallas (Fase 1)

1. **Dashboard** (`/`) — cards de Ingresos/Gastos/Balance, gráfico de torta, próximos vencimientos, FAB "+"
2. **Historial** (`/history`) — lista con filtros
3. **Cargar transacción** (modal)
4. **Presupuestos** (`/budgets`)
5. **Deudas** (`/debts`) con simulador bola de nieve vs avalancha
6. **Configuración** (`/settings`) — CRUD categorías/fijos, export JSON

## 📅 Plan de los 3 días (Fase 1)

### Día 1 - Setup + Backbone
- ✅ Vite + React + Tailwind
- ✅ Schema SQL + seed
- ✅ Express + endpoints básicos de categories y transactions
- 🔨 Layout + bottom nav + Dashboard básico + conexión Axios

### Día 2 - Funcionalidad core
- Modal "Cargar transacción"
- Historial con filtros
- CRUD completo de categorías
- Presupuestos + status
- Gráficos en dashboard (Recharts)

### Día 3 - Deudas + Polish + Deploy
- CRUD de deudas + simulador
- Gastos fijos
- PWA (manifest + service worker)
- Deploy Vercel + Railway
- Cargar datos reales y usarla

## ✅ Definición de MVP terminado (Fase 1)

- [ ] Cargar un gasto en menos de 10 segundos
- [ ] Ver total gastado del mes
- [ ] Ver gráfico de gastos por categoría
- [ ] Definir presupuestos y ver si me paso
- [ ] Registrar deudas y simular pagos
- [ ] PWA instalada en celular
- [ ] Funciona online (deployed)

## 🚫 Fuera de Fase 1 (queda para v2/Fase 2/3)

- ❌ Importación automática de PDFs de tarjeta
- ❌ Login/auth
- ❌ Multiusuario
- ❌ Notificaciones push
- ❌ Stats históricas avanzadas (mes/año a año)
- ❌ Subcategorías
- ❌ Tags
- ❌ Export Excel/CSV

---

# 🟡 Fase 2 — Vida (Hábitos)

> **Condición de arranque:** Fase 1 deployada + 1-2 semanas de uso real. Si no se usó, no se construye.

## 🎯 Los 5 trackers (todos < 30 seg/día combinados)

| # | Tracker | Cómo se carga | Para qué sirve |
|---|---|---|---|
| 1 | **Sueño** | Al despertar: "dormí de X a Y" | Ver promedio semanal y noches de <6hs |
| 2 | **Scroll nocturno** | Toggle "¿cel después de medianoche?" | Atacar el TikTok hasta las 3am |
| 3 | **Comida** | 3 toggles (des/alm/cena): sano / medio / mal | Patrón semanal de alimentación |
| 4 | **Movimiento** | 1 botón "hoy moví el cuerpo" | Días activos vs sedentarios |
| 5 | **Intención del día** | Mañana: 1 frase. Noche: ¿la cumpliste? | Antídoto al "se me fue el día" |

## 🗃️ Schema (Fase 2, borrador)

```sql
CREATE TABLE sleep_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  slept_at TEXT NOT NULL,      -- HH:MM (hora de dormir)
  woke_at TEXT NOT NULL,       -- HH:MM (hora de despertar)
  hours_slept REAL,            -- calculado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE screen_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  late_night_phone BOOLEAN NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meal_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  meal TEXT NOT NULL,          -- 'desayuno' | 'almuerzo' | 'cena'
  quality TEXT NOT NULL,       -- 'sano' | 'medio' | 'mal'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, meal)
);

CREATE TABLE movement_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  moved BOOLEAN NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_intentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  intention TEXT NOT NULL,
  accomplished BOOLEAN,        -- NULL = aún no respondido
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints (Fase 2)

- `GET/POST /api/sleep`
- `GET/POST /api/screen`
- `GET/POST /api/meals`
- `GET/POST /api/movement`
- `GET/POST /api/intentions`
- `GET /api/vida/weekly` — resumen semanal (todos los trackers)
- `GET /api/resumen/weekly` — **vista cruzada finanzas + vida** (la joya)

## 📱 Pantallas (Fase 2)

1. **Vida — Check-in diario** (`/vida`) — formulario combinado, < 30 seg
2. **Vida — Resumen semanal** (`/vida/semanal`) — patrones de los 5 trackers
3. **Resumen cruzado** (`/resumen`) — finanzas + vida juntas, semanal
4. **Rachas** — componente en Dashboard mostrando streaks ("3 días sin cel después de medianoche")

## ✅ Definición de MVP terminado (Fase 2)

- [ ] Check-in diario de los 5 trackers en < 30 seg
- [ ] Vista semanal con promedios y patrones
- [ ] Vista cruzada finanzas ↔ vida (semanal + mensual)
- [ ] Streaks visibles en Dashboard
- [ ] Resumen del domingo (vista de "así estuvo tu semana")

---

# 🔵 Fase 3 — Multiusuario / Comunidad (a evaluar)

> **Condición de arranque:** Fase 1+2 sostenidas como uso personal real durante 2-3 meses. Si no se sostiene para uno mismo, no exportar el problema.

Cambios principales:
- Tabla `users` + columna `user_id` en todas las tablas existentes
- Auth: JWT o sesiones con cookie httpOnly
- Migración SQLite → PostgreSQL (cuando supere ~100-200 usuarios reales)
- Encriptación de datos sensibles (finanzas)
- Posible comparativa anónima opcional con amigos (ej: "tu grupo durmió promedio 6h esta semana")

---

## 📝 Convenciones de código

- **Nombres de variables**: camelCase en JS, snake_case en SQL
- **Componentes React**: PascalCase
- **Endpoints**: kebab-case en URLs (`/fixed-expenses`)
- **Commits Git**: prefijo (`feat:`, `fix:`, `refactor:`, `style:`)
- **Money**: siempre número (REAL en SQL), formato visual en frontend

## 🆘 Comandos importantes

```bash
# Desarrollo (2 terminales en paralelo)
cd client && npm run dev    # Frontend en :5173
cd server && npm run dev    # Backend en :3000 (con --watch)

# Build de producción
cd client && npm run build

# Inicializar / resetear DB
cd server && npm run init-db
# Reset total (cuidado: borra todo):
#   rm server/db/finanzas.db && npm run init-db
```
