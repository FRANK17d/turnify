# 🚀 Guía de Despliegue de Turnify (Render + Vercel)

Esta guía cubre el despliegue del proyecto **Turnify** utilizando **Render** para el Backend/Base de Datos y **Vercel** para el Frontend.

---

## 🛠️ Parte 1: Backend en Render

El backend (NestJS), la base de datos (PostgreSQL) y Redis vivirán en Render.

### 1. Preparar el Repositorio
Asegúrate de haber subido el archivo `render.yaml` que está en la raíz de tu proyecto a GitHub.

### 2. Crear cuenta en Render
1.  Ve a [Render.com](https://render.com/) y crea una cuenta (usa GitHub).

### 3. Crear Blueprint (Infraestructura como Código)
La forma más fácil de desplegar el monorepo (Backend + DB + Redis) es usando Blueprints.

1.  En el Dashboard de Render, haz clic en **New +** -> **Blueprint**.
2.  Conecta tu repositorio de GitHub `turnify`.
3.  Render detectará automáticamente el archivo `render.yaml`.
4.  Le dará un nombre al servicio (ej. `turnify-backend`) y a las bases de datos.
5.  Haz clic en **Apply**.

### 4. Configurar Variables de Entorno Faltantes
El `render.yaml` configura casi todo, pero hay variables secretas que debes poner manualmente en el Dashboard después de crear el Blueprint:

1.  Ve al Dashboard -> Servicios -> `turnify-backend` -> **Environment**.
2.  Agrega las siguientes variables (si no se crearon o para actualizarlas):
    *   `STRIPE_SECRET_KEY`: Tu clave `sk_test_...`
    *   `STRIPE_WEBHOOK_SECRET`: Tu secreto de webhook.
    *   `SMTP_HOST`: `smtp.gmail.com`
    *   `SMTP_USER`: Tu email.
    *   `SMTP_PASSWORD`: Tu contraseña de aplicación.
    *   `SENTRY_DSN`: `https://2abce1bc5d3ba58cea7060dce565ffc1@o4510671399616512.ingest.us.sentry.io/4510671407808512`
    *   `FRONTEND_URL`: La URL que obtendrás de Vercel.

### 5. Obtener URL del Backend
Una vez desplegado (puede tardar unos minutos la primera vez):
1.  Ve al servicio `turnify-backend`.
2.  Copia la URL de arriba a la izquierda (ej: `https://turnify-backend.onrender.com`).
3.  Esta será tu `API_URL`.

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
| `API_URL` | La URL de Render que copiaste (ej: `https://turnify-backend.onrender.com`) |

> **Importante:** Recuerda editar `frontend/src/environments/environment.prod.ts` con la URL de Render antes de hacer el último push, ya que Angular compila las variables de entorno dentro del bundle JS.

### 4. Desplegar
1.  Haz clic en **Deploy**.
2.  Vercel construirá y te dará una URL (ej: `https://turnify.vercel.app`).

---

## 🔄 Parte 3: Conexión Final

1.  Vuelve a **Render** -> `turnify-backend` -> Environment.
2.  Actualiza `FRONTEND_URL` con la URL final de Vercel (sin trailing slash).
3.  Render reiniciará el servicio automáticamente.

¡Listo! Tu aplicación debería estar funcionando en producción. 🚀
