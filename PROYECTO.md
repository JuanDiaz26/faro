# 💰 Finanzas App - Proyecto Personal

## 🎯 Objetivo del proyecto

Aplicación web personal (instalable como PWA en celular) para gestión de finanzas personales. El objetivo final es **salir de deudas, empezar a ahorrar y entender en qué se va el dinero**.

Es de uso personal (un solo usuario), por lo que **no necesita sistema de autenticación en la v1**.

---

## 🛠️ Stack técnico

### Frontend
- **React 18** con **Vite** (no Create React App)
- **TailwindCSS** para estilos
- **shadcn/ui** para componentes base
- **Recharts** para gráficos
- **Axios** para llamadas HTTP
- **React Router** para navegación
- **Zustand** para estado global
- **PWA** (manifest.json + service worker básico)

### Backend
- **Node.js + Express**
- **better-sqlite3** (síncrono, más rápido para uso local)
- **cors** + **helmet** (seguridad básica)
- **express-validator** para validar inputs

### Base de datos
- **SQLite** (un solo archivo `finanzas.db`)

### Deploy (cuando esté listo)
- **Frontend**: Vercel
- **Backend + DB**: Railway (con volumen persistente para el .db)

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
│   │   │   ├── ui/          # Botones, inputs, cards
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── CategoryPicker.jsx
│   │   │   └── ...
│   │   ├── pages/           # Pantallas principales
│   │   │   ├── Dashboard.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Debts.jsx
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
│   │   ├── transactions.js
│   │   ├── categories.js
│   │   ├── budgets.js
│   │   ├── debts.js
│   │   └── fixed-expenses.js
│   ├── controllers/          # Lógica de negocio
│   ├── middleware/           # Validaciones, errores
│   ├── db/
│   │   ├── schema.sql       # Schema de la DB
│   │   ├── seed.js          # Datos iniciales (categorías)
│   │   └── finanzas.db      # La DB en sí
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗃️ Schema de la base de datos

```sql
-- Categorías de gastos/ingresos
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,         -- hex color
  icon TEXT NOT NULL,          -- emoji o nombre de icono
  type TEXT NOT NULL,          -- 'expense' | 'income'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transacciones (gastos e ingresos)
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

-- Presupuestos mensuales por categoría
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  monthly_limit REAL NOT NULL,
  month INTEGER NOT NULL,      -- 1-12
  year INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE(category_id, month, year)
);

-- Deudas
CREATE TABLE debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  total_amount REAL NOT NULL,
  remaining_amount REAL NOT NULL,
  interest_rate REAL DEFAULT 0,    -- % anual
  minimum_payment REAL DEFAULT 0,
  due_day INTEGER,                  -- día del mes (1-31)
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gastos fijos recurrentes
CREATE TABLE fixed_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  due_day INTEGER,                  -- día del mes
  active BOOLEAN DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Ingresos recurrentes
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
🍔 Comida          (expense, #FF6B6B)
🍽️ Cenas/Salidas   (expense, #FFA94D)
⛽ Transporte      (expense, #4DABF7)
💪 Salud/Fitness   (expense, #51CF66)
💇 Cuidado personal (expense, #DA77F2)
👕 Ropa            (expense, #FF8787)
📱 Telefonía       (expense, #748FFC)
🏠 Gastos fijos    (expense, #868E96)
🎮 Ocio/Vicios     (expense, #F783AC)
💳 Pago deudas     (expense, #FA5252)
📦 Otros           (expense, #ADB5BD)
💼 Sueldo          (income, #20C997)
💰 Extras          (income, #15AABF)
```

---

## 🔌 API Endpoints

### Transactions
- `GET /api/transactions` — lista con filtros (mes, categoría)
- `GET /api/transactions/:id` — detalle
- `POST /api/transactions` — crear
- `PUT /api/transactions/:id` — editar
- `DELETE /api/transactions/:id` — borrar
- `GET /api/transactions/summary` — totales del mes actual

### Categories
- `GET /api/categories`
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
- `POST /api/debts/:id/payment` — registrar pago (reduce remaining)
- `GET /api/debts/simulator?monthly_payment=X` — proyección

### Fixed Expenses
- `GET /api/fixed-expenses`
- `POST /api/fixed-expenses`
- `PUT /api/fixed-expenses/:id`
- `DELETE /api/fixed-expenses/:id`

### Dashboard
- `GET /api/dashboard` — todo en un endpoint:
  - Total gastado del mes
  - Total ingresos del mes
  - Balance
  - Top 3 categorías de gasto
  - Próximos vencimientos (deudas + fijos)
  - Dinero disponible restante del mes

---

## 📱 Pantallas (vistas)

### 1. Dashboard (`/`)
- Header con mes/año actual
- 3 cards: Ingresos / Gastos / Balance
- Gráfico de torta: gastos por categoría
- "Te quedan X días y $Y disponibles"
- Lista corta: próximos vencimientos
- **Botón flotante "+" siempre visible**

### 2. Historial (`/history`)
- Filtros: mes, categoría, método de pago
- Lista de transacciones (más recientes primero)
- Tap en una transacción → editar/borrar
- Total filtrado al final

### 3. Cargar transacción (Modal, no es pantalla)
- Input grande de monto (foco automático)
- Selector de categoría (grilla con iconos)
- Toggle: Gasto / Ingreso
- Descripción opcional
- Método de pago
- Fecha (default: hoy)
- Botón "Guardar"

### 4. Presupuestos (`/budgets`)
- Lista de categorías con barra de progreso
- "Cenas: $24.000 / $30.000 (80%)" en amarillo
- Rojo cuando > 100%
- Tap → editar límite mensual

### 5. Deudas (`/debts`)
- Lista de deudas activas con monto restante
- Card con "Total deuda: $X"
- Simulador: "Si pagás $X/mes, salís en Y meses"
- Comparación: estrategia bola de nieve vs avalancha
- Botón "Registrar pago" en cada deuda

### 6. Configuración (`/settings`)
- Gestión de categorías (CRUD)
- Gestión de gastos fijos
- Gestión de ingresos recurrentes
- Botón "Exportar datos a JSON" (backup)

---

## 📅 Plan de los 3 días

### Día 1 - Setup + Backbone
**Mañana/Tarde:**
- Crear proyecto: `vite + react`, `npm init` server
- Configurar Tailwind, instalar dependencias
- Schema SQL + seed de categorías iniciales
- Setup Express + better-sqlite3
- Endpoints básicos de `categories` y `transactions` (GET, POST)
- Probar con Postman/Thunder Client

**Noche:**
- Layout principal del frontend (navegación, bottom bar)
- Conectar frontend con backend (axios)
- Página Dashboard básica (solo total del mes)

### Día 2 - Funcionalidad core
**Mañana:**
- Modal "Cargar transacción" funcional
- Página de Historial con filtros
- Endpoints restantes de transactions
- Validaciones en frontend y backend

**Tarde:**
- CRUD de categorías completo
- Página de presupuestos
- Endpoint de status de presupuestos

**Noche:**
- Gráficos en dashboard (Recharts)
- Resumen del mes funcionando

### Día 3 - Deudas + Polish + Deploy
**Mañana:**
- CRUD de deudas
- Simulador básico de deudas
- Pantalla de deudas

**Tarde:**
- Gastos fijos
- Configuración PWA (manifest + service worker)
- Testing manual de todo el flujo
- Estilos finales

**Noche:**
- Deploy frontend a Vercel
- Deploy backend a Railway
- Configurar volumen persistente para SQLite
- Instalar la PWA en el celular
- Cargar datos reales y empezar a usarla

---

## ✅ Definición de "MVP terminado"

El MVP está listo cuando:
- [ ] Puedo cargar un gasto en menos de 10 segundos
- [ ] Veo el total gastado del mes
- [ ] Veo en qué categorías gasto más (gráfico)
- [ ] Puedo definir presupuestos y ver si me paso
- [ ] Puedo registrar mis deudas y simular pagos
- [ ] Está instalada como PWA en mi celular
- [ ] Funciona online (deployed)

---

## 🚫 Lo que NO entra en el MVP (queda para v2)

- ❌ Importación automática de PDFs de tarjeta
- ❌ Sistema de login/auth
- ❌ Múltiples usuarios
- ❌ Notificaciones push
- ❌ Estadísticas históricas avanzadas (mes a mes, año a año)
- ❌ Categorías subnivel (subcategorías)
- ❌ Tags personalizados
- ❌ Exportación a Excel/CSV

---

## 📝 Convenciones de código

- **Nombres de variables**: camelCase en JS, snake_case en SQL
- **Componentes React**: PascalCase
- **Endpoints**: kebab-case en URLs (`/fixed-expenses`)
- **Commits Git**: prefijo (`feat:`, `fix:`, `refactor:`, `style:`)
- **Money**: siempre en número (REAL en SQL), formato visual en frontend

---

## 🆘 Comandos importantes

```bash
# Iniciar todo
cd client && npm run dev    # Frontend en :5173
cd server && npm run dev    # Backend en :3000

# Build de producción
cd client && npm run build

# Reset de DB (cuidado!)
rm server/db/finanzas.db && node server/db/init.js
```
