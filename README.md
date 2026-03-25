# HTTP Group Project — Networks & Communications 2
**Universidad San Jorge · Zaragoza**

Implementation of an HTTP/1.1 client and server from scratch using raw TCP sockets in Node.js.

---

## 📁 Project Structure
- `/core` — HTTP parser and serializer
- `/client-lib` — TCP client library
- `/client-cli` — Interactive CLI client
- `/server-lib` — TCP server library
- `/server-api` — REST API endpoints
- `/features` — Optional features

---

## 🚀 How to run

```bash
# Server
node server-api/index.js --port 3000

# Client
node client-cli/index.js
```

---

## 👥 Team
- Persona 1 — Core Parser
- Persona 2 — Client CLI
- Persona 3 — Server Library
- Persona 4 — REST API
- Persona 5 — Authentication
- Persona 6 — Testing & Infra

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
Cada persona crea su rama desde `develop`:
```
feature/core
feature/client-lib
feature/client-cli
feature/server-lib
feature/server-api
feature/infra
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

# 4. Cuando tu área esté lista, abre un Pull Request a develop en GitHub
```

### Reglas de commits (obligatorias)
Usar siempre este formato:
```
feat: añadir parseRequest al core
fix: corregir parsing de headers con espacios
chore: actualizar .gitignore
docs: añadir sección de autenticación al README
test: añadir tests para endpoint GET /cats
refactor: separar lógica de routing en fichero aparte
```

### Reglas de Pull Request
- Mínimo **1 compañero** debe revisar antes de mergear a `develop`
- No se mergea si hay conflictos sin resolver
- El título del PR debe describir qué hace: `feat: client library con soporte TCP`

### ⚠️ Prohibido
- Pushear directamente a `main` o `develop`
- Commitear `node_modules/`
- Commits con mensaje "cambios", "asdf" o similar (afecta a la nota)

---

## 🔀 Flujo visual

```
main        ←────────────────── solo al entregar (13 mayo)
  │
develop     ←── PR revisado ←── feature/core
                               feature/client-lib
                               feature/client-cli
                               feature/server-lib
                               feature/server-api
                               feature/infra
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
