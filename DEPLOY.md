# 🚀 Guía de Despliegue de Turnify

Esta guía cubre el despliegue del proyecto **Turnify** utilizando **Railway** para el Backend/Base de Datos y **Vercel** para el Frontend.

---

## 🛠️ Parte 1: Backend en Railway

El backend (NestJS), la base de datos (PostgreSQL) y Redis vivirán en Railway.

### 1. Configuración Inicial
1.  Ve a [Railway.app](https://railway.app/) y crea una cuenta (puedes usar GitHub).
2.  Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Selecciona el repositorio de **Turnify**.
4.  Cuando te pregunte por configuración, haz clic en **"Add Variables"** pero **NO** despliegues aún si es posible, o cancela el despliegue inicial si empieza.

### 2. Configurar el Monorepo (Root Directory)
Como tenemos un monorepo, debemos indicar que el backend está en la carpeta `backend/`.
1.  En tu proyecto de Railway, ve a **Settings** del servicio que se creó (probablemente llamado "Turnify" o similar).
2.  Busca la sección **App Root**, **Root Directory** o **Watch Patterns**.
3.  Cambia el **Root Directory** a: `/backend`
4.  Esto es crucial para que Railway encuentre el `package.json` y el `railway.json` que acabamos de crear.

### 3. Agregar Servicios de Base de Datos
Dentro del mismo proyecto en Railway (vista de canvas):
1.  Haz clic derecho o en el botón "New" -> **Database** -> **Add PostgreSQL**.
2.  Haz clic derecho o en el botón "New" -> **Database** -> **Add Redis**.

### 4. Variables de Entorno (Backend)
Ve al servicio de tu backend (NestJS) -> pestaña **Variables**. Agrega las siguientes.
*Nota: Railway provee variables mágicas para los servicios conectados en el mismo proyecto, úsalas.*

| Variable | Valor / Origen |
|----------|----------------|
| `PORT` | `3000` |
| `DB_HOST` | `${PostgreSQL.HOST}` (Variable de Railway) |
| `DB_PORT` | `${PostgreSQL.PORT}` |
| `DB_USERNAME` | `${PostgreSQL.USER}` |
| `DB_PASSWORD` | `${PostgreSQL.PASSWORD}` |
| `DB_NAME` | `${PostgreSQL.DATABASE}` |
| `REDIS_HOST` | `${Redis.HOST}` |
| `REDIS_PORT` | `${Redis.PORT}` |
| `REDIS_PASSWORD`| `${Redis.PASSWORD}` (Si aplica, verifica en Redis -> Connect) |
| `JWT_SECRET` | Genera una cadena larga y segura |
| `JWT_EXPIRES_IN`| `15m` |
| `JWT_REFRESH_SECRET` | Genera otra cadena larga y segura |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `STRIPE_SECRET_KEY` | Tu clave `sk_test_...` de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Tu clave de webhook de Stripe |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Tu email de Gmail |
| `SMTP_PASSWORD`| Tu contraseña de aplicación de Gmail |
| `SMTP_FROM` | Igual a SMTP_USER |
| `SENTRY_DSN` | `https://2abce1bc5d3ba58cea7060dce565ffc1@o4510671399616512.ingest.us.sentry.io/4510671407808512` |
| `FRONTEND_URL` | La URL que te dará Vercel (ej: `https://turnify-frontend.vercel.app`) |

### 5. Desplegar Backend
Una vez configuradas las variables y el Root Directory:
1.  Railway debería re-desplegar automáticamente. Si no, haz clic en **Deploy**.
2.  Una vez "Active", ve a **Settings** -> **Networking** -> **Generate Domain**.
    *   Te dará algo como: `turnify-production.up.railway.app`
    *   **Copia esta URL**, será tu `API_URL`.

---

## 🎨 Parte 2: Frontend en Vercel

### 1. Configuración Inicial
1.  Ve a [Vercel.com](https://vercel.com/) -> **Add New** -> **Project**.
2.  Importa el repositorio de **Turnify**.

### 2. Configurar Build (Importante para Monorepo)
En la pantalla de "Configure Project":
1.  **Framework Preset:** Angular
2.  **Root Directory:** Haz clic en "Edit" y selecciona la carpeta `frontend`.

### 3. Variables de Entorno (Frontend)
En la sección **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `API_URL` | La URL de Railway que copiaste (ej: `https://turnify-production.up.railway.app`) |

> **Nota:** Angular en tiempo de compilación usa `environment.prod.ts`. Necesitaremos asegurar que `environment.prod.ts` lea esta variable o modificar el archivo antes de subirlo si Vercel no inyecta variables en runtime (Angular es SPA estática).
>
> **Mejor Práctica Angular+Vercel:**
> Vercel construye la app. Lo ideal es actualizar tu `src/environments/environment.prod.ts` con la URL real de producción antes del último commit, O configurar un script de pre-build.
>
> **Por ahora:** Edita `frontend/src/environments/environment.prod.ts` y pon la URL de Railway manualmente antes de hacer push.

### 4. Desplegar
1.  Haz clic en **Deploy**.
2.  Vercel construirá y te dará una URL (ej: `https://turnify.vercel.app`).

---

## 🔄 Parte 3: Conexión Final

1.  Vuelve a **Railway** -> Backend -> Variables.
2.  Actualiza `FRONTEND_URL` con la URL final de Vercel (sin traling slash).
3.  El backend se reiniciará.

¡Listo! Tu aplicación debería estar funcionando en producción. 🚀
