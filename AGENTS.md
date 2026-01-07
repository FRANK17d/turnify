# 📘 PLAN MAESTRO PARA DESARROLLAR **TURNIFY**
### SaaS White-Label Multi-Tenant (Nivel Empresa)

Este documento es la **guía paso a paso** para empezar y completar el desarrollo de **Turnify**, desde cero hasta un SaaS avanzado listo para presentación, portafolio y evaluación académica.

---

## 🎯 OBJETIVO DEL PROYECTO

Desarrollar un **SaaS White-Label Multi-Tenant de gestión de reservas** que implemente:
- Arquitectura moderna
- Seguridad avanzada (RBAC con permisos)
- Modelo de suscripciones (Stripe sandbox)
- Procesos asíncronos
- Auditoría avanzada
- Escalabilidad y buenas prácticas

---

## 🧠 VISIÓN GENERAL DEL STACK

**Backend**
- Node.js
- NestJS
- PostgreSQL
- Redis
- BullMQ
- WebSockets
- Webhooks
- Stripe (modo prueba)

**Frontend**
- Angular (SPA)
- TypeScript
- Tailwind CSS
- RBAC UI

**Infraestructura**
- Docker
- Docker Compose
- CI/CD (básico)
- Sentry

---

## 🗺️ ORDEN CORRECTO DE DESARROLLO (MUY IMPORTANTE)

> ❗ No saltes pasos. Sigue este orden.

1. Diseño (arquitectura + BD)
2. Backend base (auth + multi-tenant)
3. RBAC con permisos
4. Suscripciones
5. Auditoría + soft delete
6. Jobs y tiempo real
7. Frontend Angular
8. Infraestructura y cierre

---

## 🧱 FASE 1: DISEÑO INICIAL

### 1.1 Definir el dominio
- El sistema se llamará **Turnify**
- Rubro: gestión de reservas (genérico)
- Cada empresa = un tenant

### 1.2 Definir roles base
- SUPER_ADMIN
- ADMIN_EMPRESA
- CLIENTE

### 1.3 Definir permisos
Ejemplos:
- MANAGE_USERS
- MANAGE_SERVICES
- CREATE_BOOKING
- VIEW_REPORTS
- MANAGE_BRANDING

---

## 🗄️ FASE 2: BASE DE DATOS

### 2.1 Crear base de datos PostgreSQL

Tablas principales:
- tenants
- users
- roles
- permissions
- role_permissions
- user_roles
- services
- bookings
- plans
- subscriptions
- payments
- audit_logs

### 2.2 Reglas clave
- Todas las tablas importantes llevan `tenant_id`
- Implementar `deleted_at` para soft delete
- Auditoría con `old_value` y `new_value` (JSON)

---

## ⚙️ FASE 3: BACKEND – NESTJS

### 3.1 Inicializar proyecto
- Crear proyecto NestJS
- Configurar módulos
- Configurar variables de entorno

### 3.2 Autenticación
- Login con email/password
- JWT
- Refresh Token
- Recuperación de contraseña (Forgot / Reset Password)
- Incluir en el token:
  - user_id
  - tenant_id
  - roles
  - permisos

**Protección contra intentos de acceso indebidos:**
- Contador de intentos fallidos por usuario + IP (Redis)
- Máximo 5 intentos fallidos consecutivos
- Al superar el límite:
  - Bloqueo temporal del login (ej. 15 minutos)
  - Registrar evento en auditoría
- Diferenciar casos:
  - Usuario existente con contraseña incorrecta
  - Usuario inexistente (respuesta genérica)
- Respuesta siempre genérica: *"Credenciales inválidas"*
- Integración con Rate Limiting para evitar fuerza bruta

- Login con email/password
- JWT
- Refresh Token
- Incluir en el token:
  - user_id
  - tenant_id
  - roles
  - permisos

**Protección contra intentos de acceso indebidos:**
- Contador de intentos fallidos por usuario + IP (Redis)
- Máximo 5 intentos fallidos consecutivos
- Al superar el límite:
  - Bloqueo temporal del login (ej. 15 minutos)
  - Registrar evento en auditoría
- Diferenciar casos:
  - Usuario existente con contraseña incorrecta
  - Usuario inexistente (respuesta genérica)
- Respuesta siempre genérica: *"Credenciales inválidas"*
- Integración con Rate Limiting para evitar fuerza bruta
- Login con email/password
- JWT
- Refresh Token
- Incluir en el token:
  - user_id
  - tenant_id
  - roles
  - permisos

---

## 🔐 FASE 4: RBAC CON PERMISOS

### 4.1 Backend
- Crear `PermissionsGuard`
- Crear decorador `@RequirePermissions`
- Validar permisos en cada endpoint crítico

### 4.2 Flujo
Request → JWT Guard → Permission Guard → Controller

---

## 💳 FASE 5: SUSCRIPCIONES (STRIPE – SANDBOX)

### 5.1 Planes
- FREE (limitado)
- PRO (sin límites)

### 5.2 Lógica
- Middleware `SubscriptionGuard`
- Bloquear acciones si se excede el plan
- Validar estado de la suscripción (`ACTIVE`, `PAST_DUE`, `CANCELED`)

**Regla clave:**
- Si la empresa **no paga o vence su suscripción**, el tenant pasa a estado **PAST_DUE** o **CANCELED**
- El sistema **NO elimina datos** ni borra la empresa
- Se habilita un **modo restringido**

**Modo restringido (cuando NO paga):**
- Login permitido
- Acceso solo lectura a datos
- Bloqueo de acciones críticas:
  - Crear / editar reservas
  - Crear usuarios
  - Acceder a funciones PRO
- Mostrar mensajes claros de **"Suscripción vencida"** y botón de **Actualizar plan**

### 5.3 Stripe
- Usar claves `sk_test_`
- Crear checkout de prueba
- Recibir webhook:
  - checkout.session.completed
  - customer.subscription.deleted
  - invoice.payment_failed

**Comportamiento ante eventos:**
- `checkout.session.completed` → activar suscripción + enviar email de confirmación
- `invoice.payment_failed` → marcar suscripción como `PAST_DUE` + enviar aviso por email
- `customer.subscription.deleted` → marcar suscripción como `CANCELED` + enviar email de cancelación

- Usar claves `sk_test_`
- Crear checkout de prueba
- Recibir webhook:
  - checkout.session.completed

---

## 🧾 FASE 6: AUDITORÍA AVANZADA

### 6.1 Qué auditar
- Login
- Crear / editar / eliminar reservas
- Cambios de configuración

### 6.2 Implementación
- Interceptor global
- Guardar:
  - acción
  - entidad
  - old_value
  - new_value
  - usuario
  - tenant

---

## 🗑️ FASE 7: SOFT DELETE

### 7.1 Regla
- Nunca borrar registros físicamente
- Usar `deleted_at`

### 7.2 Aplicar a
- users
- services
- bookings

---

## ⚡ FASE 8: JOBS Y PROCESOS ASÍNCRONOS

### Objetivo
Automatizar tareas del sistema sin afectar el rendimiento del flujo principal.

### 8.1 Redis
- Cache simple

### 8.2 BullMQ
- Job: recordatorio de reserva
- Job: control de suscripción
- Job: envío de notificaciones (email / in-app)
- Job: recuperación de contraseña

**Correos enviados automáticamente:**
- Recuperación de contraseña
- Confirmación de cambio de contraseña
- Suscripción creada / cancelada / vencida
- Confirmación y recordatorio de reservas

- Job: recordatorio de reserva
- Job: control de suscripción
- Job: envío de notificaciones (email / in-app)

**Notificaciones por correo (Email):**
- Envío de correos automáticos mediante jobs (no síncronos)
- Eventos que disparan email:
  - Suscripción creada (bienvenida / confirmación)
  - Suscripción renovada
  - Suscripción cancelada
  - Suscripción vencida o por vencer
  - Confirmación de reserva
  - Cancelación de reserva
- Los correos se envían **en segundo plano** para no afectar la experiencia del usuario

**Proveedor SMTP:**
- Entorno académico / desarrollo:
  - Gmail SMTP (cuenta dedicada)
  - Mailtrap o Ethereal como alternativa
- Producción (referencial):
  - SendGrid / Amazon SES

**Buenas prácticas Gmail SMTP:**
- Usar cuenta exclusiva para el sistema
- Autenticación mediante contraseña de aplicación
- No hardcodear credenciales (usar variables de entorno)


- Job: recordatorio de reserva
- Job: control de suscripción
- Job: envío de notificaciones (email / in-app)

### 8.3 Cron
- Programar ejecución automática

- Programar ejecución automática

---

## 🔔 FASE 9: WEBSOCKETS Y NOTIFICACIONES EN TIEMPO REAL

### Objetivo
Proveer comunicación en tiempo real y notificaciones inmediatas respetando permisos y aislamiento por tenant.

- Evento: `booking.created`
- Evento: `booking.updated`
- Evento: `subscription.expired`
- Admin ve reservas en tiempo real
- Usuario recibe notificaciones in-app

> Nota: Las notificaciones **persistentes** (in-app) son diferentes a los **toasts**, que son mensajes temporales de feedback.

### Objetivo
Proveer comunicación en tiempo real y notificaciones inmediatas respetando permisos y aislamiento por tenant.

- Evento: `booking.created`
- Evento: `booking.updated`
- Evento: `subscription.expired`
- Admin ve reservas en tiempo real
- Usuario recibe notificaciones in-app


### Objetivo
Proveer comunicación en tiempo real respetando permisos y aislamiento por tenant.


- Evento: `booking.created`
- Admin ve reservas en tiempo real

---

## 🖥️ FASE 10: FRONTEND – ANGULAR

### Stack UI
- Angular
- Tailwind CSS (utility-first)
- Componentes reutilizables
- Soporte para accesibilidad básica (focus, estados, contraste)


### 10.1 Estructura
- auth/
- core/
- super-admin/
- tenant-admin/
- client/

### 10.2 Seguridad
- AuthGuard
- PermissionGuard
- SubscriptionGuard

### 10.3 RBAC UI
- Mostrar/ocultar botones por permiso
- Bloquear funciones por plan

### 10.4 Feedback UI (Toast / Alerts)
- Mostrar **toasts** para feedback inmediato de acciones del usuario
- Tipos de toast:
  - Éxito: acción realizada correctamente (ej. "Reserva creada")
  - Error: fallo de validación o permisos
  - Advertencia: límites de plan, acciones bloqueadas
  - Información: cambios de estado (ej. suscripción por vencer)
- Los toasts **no reemplazan** las notificaciones, solo refuerzan la UX
- Implementación sugerida:
  - Angular Material Snackbar o librería de toasts
- Mensajes controlados desde el frontend, basados en respuestas del backend
- Mostrar/ocultar botones por permiso
- Bloquear funciones por plan

---

## ⚙️ FASE 11: CONFIGURACIÓN, PERFIL Y NOTIFICACIONES

### Objetivo
Permitir que usuarios y empresas gestionen su información, preferencias, seguridad y notificaciones sin depender de soporte técnico.


### Objetivo
Permitir que usuarios y empresas gestionen su información, preferencias y seguridad sin depender de soporte técnico.

### 11.1 Perfil de Usuario
- Ver y editar datos personales (nombre, email)
- Cambio de contraseña
- Cierre de sesión en todos los dispositivos
- Visualización de roles y permisos asignados
- Preferencias de notificaciones:
  - Activar / desactivar correos
  - Activar / desactivar notificaciones in-app

- Ver y editar datos personales (nombre, email)
- Cambio de contraseña
- Cierre de sesión en todos los dispositivos
- Visualización de roles y permisos asignados
- Preferencias de notificaciones (activar / desactivar)

- Ver y editar datos personales (nombre, email)
- Cambio de contraseña
- Cierre de sesión en todos los dispositivos
- Visualización de roles y permisos asignados

### 11.2 Configuración de Empresa (Tenant Settings)
- Nombre del negocio
- Logo
- Color principal
- Estado del tenant (solo lectura si está bloqueado)
- Zona horaria

### 11.3 Configuración de Seguridad

#### Recuperación de Contraseña
- Flujo **Forgot Password / Reset Password**
- El usuario solicita recuperación ingresando su email
- El sistema envía un **correo con link temporal** (token de un solo uso)
- El token:
  - Tiene expiración (ej. 15–30 minutos)
  - Es de un solo uso
  - Se invalida al cambiar la contraseña
- El usuario define una nueva contraseña

**Reglas de seguridad:**
- Respuesta genérica: *"Si el correo existe, se enviaron instrucciones"*
- No revelar si el email está registrado
- Registrar evento en auditoría
- Cambio de contraseña invalida todas las sesiones activas

#### Gestión de Sesiones por Dispositivo
- Cada inicio de sesión genera una **sesión única** asociada a:
  - user_id
  - tenant_id
  - dispositivo / navegador
  - IP aproximada
  - fecha de inicio

- El sistema maneja **múltiples sesiones activas por usuario** (multi-dispositivo).
- Las sesiones se controlan mediante **Refresh Tokens** almacenados en base de datos.


#### Gestión de Sesiones por Dispositivo
- Cada inicio de sesión genera una **sesión única** asociada a:
  - user_id
  - tenant_id
  - dispositivo / navegador
  - IP aproximada
  - fecha de inicio

- El sistema maneja **múltiples sesiones activas por usuario** (multi-dispositivo).
- Las sesiones se controlan mediante **Refresh Tokens** almacenados en base de datos.

**Reglas clave:**
- El Access Token tiene vida corta (ej. 15 minutos)
- El Refresh Token identifica la sesión
- Si un Refresh Token se revoca, la sesión queda invalidada

**Acciones disponibles:**
- Ver sesiones activas (dispositivo + fecha)
- Cerrar sesión individual por dispositivo
- Cerrar sesión en todos los dispositivos
- Forzar logout de todos los usuarios del tenant (ADMIN_EMPRESA)

#### Protección ante intentos fallidos de login
- Mostrar aviso progresivo al usuario tras varios intentos fallidos
- Sugerir **recuperación de contraseña** después de 3 intentos
- Bloqueo temporal automático tras múltiples intentos fallidos
- Posibilidad de desbloqueo automático al expirar el tiempo
- Registrar intentos sospechosos en auditoría

**Casos de seguridad:**
- Cambio de contraseña → invalida todas las sesiones
- Suscripción vencida → sesiones activas permanecen, pero en modo restringido
- Usuario desactivado → todas las sesiones revocadas

#### Gestión de Sesiones por Dispositivo
- Cada inicio de sesión genera una **sesión única** asociada a:
  - user_id
  - tenant_id
  - dispositivo / navegador
  - IP aproximada
  - fecha de inicio

- El sistema maneja **múltiples sesiones activas por usuario** (multi-dispositivo).
- Las sesiones se controlan mediante **Refresh Tokens** almacenados en base de datos.

**Reglas clave:**
- El Access Token tiene vida corta (ej. 15 minutos)
- El Refresh Token identifica la sesión
- Si un Refresh Token se revoca, la sesión queda invalidada

**Acciones disponibles:**
- Ver sesiones activas (dispositivo + fecha)
- Cerrar sesión individual por dispositivo
- Cerrar sesión en todos los dispositivos
- Forzar logout de todos los usuarios del tenant (ADMIN_EMPRESA)

**Casos de seguridad:**
- Cambio de contraseña → invalida todas las sesiones
- Suscripción vencida → sesiones activas permanecen, pero en modo restringido
- Usuario desactivado → todas las sesiones revocadas

- Ver sesiones activas
- Revocar tokens (refresh tokens)
- Forzar logout por tenant (admin)

### 11.4 Configuración por Suscripción
- Ver plan actual
- Ver límites del plan
- Historial de pagos (sandbox)
- Botón de **Actualizar plan** (Stripe)

### 11.5 Permisos de acceso
- Solo ADMIN_EMPRESA puede modificar configuración
- CLIENTE solo accede a su perfil
- SUPER_ADMIN accede a todo

---

## 🎨 FASE 12: WHITE-LABEL UI

- Logo dinámico
- Color principal por tenant
- Nombre del sistema configurable

---

## 🐳 FASE 13: INFRAESTRUCTURA

### Objetivo
Garantizar despliegue reproducible, monitoreo y estabilidad del sistema.


### 13.1 Docker
- Backend
- Frontend
- PostgreSQL
- Redis

### 13.2 CI/CD
- Build
- Test
- Deploy

### 13.3 Sentry
- Captura de errores frontend y backend

---

## 🧪 FASE 14: PRUEBAS Y DEMO

### Objetivo
Validar que las reglas de negocio, seguridad y suscripciones funcionen correctamente.


- Probar límites de plan
- Probar permisos
- Probar auditoría
- Probar WebSocket

---

## 🎤 FASE 15: PREPARACIÓN PARA PRESENTACIÓN

- Diagrama de arquitectura
- Demo corta (3–5 min)
- Explicación clara de:
  - Multi-tenant
  - RBAC
  - Suscripciones
  - Auditoría

---

## 📈 FASE 16: SEGURIDAD, ESCALABILIDAD Y BUENAS PRÁCTICAS

### 16.1 Rate Limiting
- Implementar limitación de requests por tenant (Redis)
- Ejemplo: 100 requests/minuto

### 16.2 Feature Flags
- Activar/desactivar funcionalidades por tenant
- Útil para pruebas y planes PRO

### 16.3 Seed de Datos
- Crear tenants, planes, roles y permisos iniciales
- Facilita testing y demo

### 16.4 Migraciones
- Usar migraciones para cambios en la base de datos
- Nunca modificar tablas directamente en producción

### 16.5 Backups
- Estrategia básica de respaldo de PostgreSQL
- Respaldo lógico (dump)

### 16.6 Estándares de API
- Respuestas JSON consistentes
- Uso correcto de códigos HTTP
- Manejo centralizado de errores

### 16.7 Super Admin Global
- Panel exclusivo
- Gestión de tenants
- Activar / desactivar empresas

---

## 🏁 RESULTADO FINAL

Al finalizar este plan tendrás:
- Un SaaS avanzado
- Proyecto de portafolio
- Base para negocio real
- Excelente material para entrevistas

---

## 🧠 FRASE FINAL

> *Turnify es un SaaS White-Label Multi-Tenant desarrollado con Angular y NestJS, que implementa seguridad avanzada, suscripciones, auditoría y arquitectura escalable siguiendo estándares de mercado.*

---

📌 **Sigue este documento paso a paso y el proyecto sale sí o sí.**

