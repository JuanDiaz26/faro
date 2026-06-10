# 🏗️ Cómo funciona Faro — Arquitectura

Resumen práctico de cómo está armada la app, para tener el panorama claro y responder dudas sin trabarse.

---

## El flujo completo, en una línea

```
Vos (PWA en el celu)
  → React (la pantalla)
  → pega a /api/...
  → Express en Render (recibe el pedido)
  → consulta Turso (la base en la nube)
  → Express devuelve los datos
  → React los muestra
```

Frontend y backend viven **juntos en la misma URL**. La base de datos vive **aparte**, en la nube.

---

## Las 4 piezas

### 1. Frontend — React
- **React + Vite + TailwindCSS.** Es todo lo que ve el usuario: pantallas, formularios, gráficos.
- Vite **buildea** (compila) React a archivos estáticos (HTML/CSS/JS) listos para servir.
- Es una **PWA**: se instala en el celular como una app y tiene un *service worker* (cachea la interfaz para que abra rápido; las llamadas a `/api/*` nunca se cachean, siempre van a la red).
- Estado global con **Zustand**, llamadas HTTP con **Axios** (`baseURL: '/api'`).

### 2. Backend — Express (Node.js)
- Es el **servidor / API**, el intermediario entre el frontend y la base.
- El frontend le pega a rutas como `/api/transactions`, `/api/savings`, `/api/debts`, etc.
- Express recibe el pedido, **consulta la base**, y devuelve los datos en JSON.
- **No es la base de datos** — es quien la consulta.

### 3. Base de datos — Turso (SQLite en la nube)
- **Turso** es una base de datos SQLite que vive en la nube (usa **libSQL**, que es SQLite preparado para correr remoto).
- **Por qué Turso y no un archivo SQLite local:** SQLite común es un archivo en disco. Render **borra el disco cada vez que reinicia o redeploya**, así que un archivo local se perdería a cada rato. Turso vive afuera → los datos sobreviven a cualquier reinicio.
- Express se conecta con dos secretos (variables de entorno en Render):
  - `DATABASE_URL` — la dirección de tu base en Turso.
  - `DATABASE_AUTH_TOKEN` — la "llave" para entrar.
- En **desarrollo local** (tu compu), si no hay esas variables, usa un archivo SQLite local (`server/db/finanzas.db`). Mismo código, distinta base según el entorno.

### 4. Deploy — Render (monolito)
- La app es un **monolito**: Render corre **un solo servicio** que hace las dos cosas a la vez:
  - Sirve la **API** de Express (rutas `/api/*`).
  - Sirve el **frontend buildeado** de React (todo lo demás).
- No son dos deploys separados: viven en la misma URL (`faro-m5nj.onrender.com`).
- Render agarra el código de **GitHub**, hace el build del frontend y levanta Express. Configurado en `render.yaml`.
- Cada vez que hacés `git push` a `main`, Render **redeploya solo** (~3-4 min).

---

## 3 cosas clave para defenderte de preguntas

1. **"¿Dónde están mis datos?"**
   En **Turso** (la base en la nube), **no** en Render. Render es solo el server: si se reinicia o redeploya, los datos están a salvo en Turso. Además tenés export/import de backup en JSON (`Más → Backup`).

2. **"¿Por qué a veces tarda en abrir?"**
   Render en plan gratis **duerme** el server tras ~15 min sin uso. El primer pedido lo despierta (~40-50 seg de *cold start*). Después va rápido. Es el trade-off por ser gratis.

3. **"¿Es seguro / privado?"**
   Hoy es de **un solo usuario, sin login**: cualquiera con la URL podría entrar. Está bien para uso personal. Si algún día se comparte, hay que agregar login/multiusuario (es la **Fase 3** pendiente).

---

## Mini-glosario

| Término | Qué es |
|---|---|
| **PWA** | App web instalable en el celu, con ícono y pantalla completa. |
| **Build** | Compilar React a archivos estáticos listos para servir. |
| **API** | Las rutas `/api/*` por donde el frontend pide y manda datos. |
| **libSQL** | El "motor" de SQLite que usa Turso para correr en la nube. |
| **Cold start** | El despertar lento del server cuando estuvo dormido. |
| **Monolito** | Un solo servicio que sirve frontend + backend juntos. |
| **Variable de entorno** | Secreto/config que se carga en Render (ej. el token de Turso), no va en el código. |

---

## Historial corto

Antes esto corría en **Fly.io + SQLite local**. Se migró a **Render + Turso** porque Fly pasó a pedir tarjeta de crédito y el archivo SQLite local se borraba en cada reinicio. Render + Turso es **100% gratis y sin tarjeta**, y los datos persisten de verdad.
