# HTTP Group Project — Networks & Communications 2
**Universidad San Jorge · Zaragoza**

Implementation of an HTTP/1.1 client and server from scratch using raw TCP sockets in Node.js.

---

## 📁 Project Structure
- `/server` — TCP socket management, concurrency, HTTP request parsing
- `/client` — HTTP client library and interactive CLI
- `/premium` — TLS encryption and login authentication system

---

## 🚀 How to run

```bash
# Server
node server/index.js --port 3000

# Client
node client/cli.js
```

---

## 👥 Team
- Pareja A (server) — TCP Motor: sockets, concurrency, HTTP parsing
- Pareja B (client) — Client & CLI: HTTP messages, response handling
- Pareja C (premium) — Premium features: TLS, login flow

---

## 📅 Delivery
- Report & repo deadline: **May 13, 2026**
- Live demo: **May 18–20, 2026**

---

## 🌿 Git Flow — Reglas del equipo

### Ramas principales
- `main` → código estable y funcional **siempre**. Nadie pushea aquí directamente.
- `develop` → rama de integración. Se mergea a `main` solo al entregar.

### Ramas de trabajo
Cada pareja crea su rama desde `develop`:
```
feature/server
feature/client
feature/premium
```

### Cómo trabajar cada día
```bash
# 1. Antes de empezar, actualiza develop
git checkout develop
git pull origin develop

# 2. Ve a tu rama
git checkout feature/tu-area

# 3. Trabaja, y cuando termines algo que funcione:
git add .
git commit -m "feat: descripción corta de lo que hiciste"
git push origin feature/tu-area

# 4. Cuando vuestra área esté lista, abrid un Pull Request a develop en GitHub
```

### Reglas de commits (obligatorias)
Usar siempre este formato:
```
feat: añadir parseRequest al servidor
fix: corregir parsing de headers con espacios
chore: actualizar .gitignore
docs: añadir sección de TLS al README
test: añadir tests para endpoint GET /cats
refactor: separar lógica de routing en fichero aparte
```

### Reglas de Pull Request
- Mínimo **1 compañero** debe revisar antes de mergear a `develop`
- No se mergea si hay conflictos sin resolver
- El título del PR debe describir qué hace: `feat: TCP server con concurrencia`

### ⚠️ Prohibido
- Pushear directamente a `main` o `develop`
- Commitear `node_modules/`
- Commits con mensaje "cambios", "asdf" o similar (afecta a la nota)

---

## 🔀 Flujo visual

```
main        ←────────────────── solo al entregar (13 mayo)
  │
develop     ←── PR revisado ←── feature/server
                               feature/client
                               feature/premium
```

---

## ⚙️ Setup inicial (cada miembro del equipo)

```bash
# 1. Clonar el repo
git clone https://github.com/TU_USUARIO/NOMBRE_REPO.git
cd NOMBRE_REPO

# 2. Configurar identidad
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# 3. Situarse en develop y crear tu rama
git checkout develop
git checkout -b feature/tu-area
```


# Avances en el Servidor HTTP/1.1

Esta sección documenta el progreso en la implementación del servidor HTTP/1.1 desde cero, usando sockets TCP puros en Node.js.

## Funcionalidades Implementadas

### Routing Dinámico
- Sistema de rutas con parámetros dinámicos (ej. `/dogs/:id`)
- Soporte para métodos GET, POST, PUT, DELETE
- Función `matchRoute()` que compara segmentos de ruta y extrae parámetros

### API RESTful para Perros
- `GET /dogs` — Lista todos los perros
- `GET /dogs/:id` — Obtiene un perro específico
- `POST /dogs` — Crea un nuevo perro (JSON en body)
- `PUT /dogs/:id` — Actualiza un perro existente
- `DELETE /dogs/:id` — Elimina un perro
- `GET /index.html` - Devuelve un archivo html

### Tests con Bruno
- Colección completa de pruebas HTTP en `server/bruno/httpGroup/`
- Tests para todos los endpoints CRUD
- Configurados para `http://localhost:3000`

### Contenido Estático
- Archivo `public/index.html` listo para servir
- Página HTML básica con información del proyecto

## Estado Actual
- Servidor TCP funcional con buffering y concurrencia
- Parser HTTP básico
- Router con CRUD completo en memoria
- Respuestas HTTP con códigos estándar (200, 201, 204, 400, 404)
