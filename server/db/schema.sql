-- Schema de la base de datos de Finanzas App
-- SQLite. Money siempre como REAL; el formato visual va en el frontend.

-- Categorías de gastos/ingresos
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,         -- hex color
  icon TEXT NOT NULL,          -- emoji o nombre de icono
  type TEXT NOT NULL,          -- 'expense' | 'income'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transacciones (gastos e ingresos)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL,          -- 'expense' | 'income'
  payment_method TEXT,         -- 'cash' | 'debit' | 'credit' | 'transfer'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Presupuestos mensuales por categoría
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  monthly_limit REAL NOT NULL,
  month INTEGER NOT NULL,      -- 1-12
  year INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE(category_id, month, year)
);

-- Deudas
CREATE TABLE IF NOT EXISTS debts (
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
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  due_day INTEGER,                  -- día del mes
  active BOOLEAN DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Ingresos recurrentes
CREATE TABLE IF NOT EXISTS incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  source TEXT NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Metas de ahorro (Moto, Compu, Vacaciones, etc.)
CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#10b981',
  description TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Aportes de ahorro. goal_id NULL = ahorro suelto (sin meta específica).
CREATE TABLE IF NOT EXISTS savings_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  source TEXT,                 -- 'sueldo' | 'aguinaldo' | 'bono' | 'extra' | 'otro'
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE SET NULL
);

-- Tarjetas de crédito (Naranja, Visa, etc).
CREATE TABLE IF NOT EXISTS credit_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#FF6B00',
  closing_day INTEGER,        -- día del mes en que cierra el resumen (1-31)
  due_day INTEGER,            -- día del mes en que vence el pago (1-31)
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cargos pendientes de cada tarjeta para el próximo resumen.
-- remaining_months NULL = recurrente sin fin (gym, impuestos automáticos).
-- remaining_months N = cuotas que faltan (decrementa al cerrar resumen).
CREATE TABLE IF NOT EXISTS card_charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,            -- monto mensual del cargo
  remaining_months INTEGER,         -- meses que faltan; NULL = recurrente
  total_months INTEGER,             -- meses originales (solo cuotas); NULL = recurrente
  category_id INTEGER,              -- opcional, para categorizar
  charge_date DATE NOT NULL,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES credit_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ===== Fase 2 — Vida: Tareas y Metas =====

-- Tareas / recordatorios (agenda in-app).
-- recurrence: 'once' (una vez, usa due_date) | 'daily' | 'weekly' (usa weekdays) | 'monthly' (usa day_of_month)
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  notes TEXT,
  recurrence TEXT NOT NULL DEFAULT 'once',
  weekdays TEXT,                    -- 'weekly': lista CSV de 0-6 (0=domingo), ej '1,3,5'
  day_of_month INTEGER,             -- 'monthly': día del mes (1-31)
  due_date DATE,                    -- 'once': fecha puntual
  time_of_day TEXT,                 -- 'HH:MM' opcional (solo display/orden)
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Marcas de completado por día (para tareas recurrentes y únicas).
-- Una tarea está "hecha" en una fecha si existe la fila correspondiente.
CREATE TABLE IF NOT EXISTS task_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, date),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Metas / objetivos personales a futuro (distinto de savings_goals, que es plata).
CREATE TABLE IF NOT EXISTS life_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#F59E0B',
  target_date DATE,                 -- fecha objetivo opcional
  progress INTEGER DEFAULT 0,       -- 0-100, manual
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'done'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
