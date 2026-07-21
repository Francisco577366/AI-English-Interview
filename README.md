# ✦ FluentAI — Coach de inglés y entrevistas con IA (Full-Stack)

Aplicación completa para **practicar inglés** y **prepararte para entrevistas de
trabajo** conversando con un coach de IA, **por voz o texto**. Guarda tus
conversaciones para seguir tu progreso.

**Stack:** React + React Router (frontend) · Node.js + Express (backend) ·
MongoDB (base de datos) · IA de texto vía [Pollinations.ai](https://pollinations.ai) (sin API key) ·
Voz con las APIs nativas del navegador (Web Speech) · Docker Compose.

## Funciones

- **Dos modos:** Práctica de inglés (conversación + correcciones) y Simulador de entrevista (preguntas + feedback).
- **Voz completa:** habla por micrófono (reconocimiento de voz) y la IA te responde en texto y en voz alta.
- **Cuentas seguras:** registro/login con JWT + bcrypt.
- **Historial:** guarda tus conversaciones y vuelve a verlas cuando quieras.

## Estructura

```
FluentAI/
├─ docker-compose.yml     # mongo + backend + frontend (un comando)
├─ frontend/              # React + Vite → nginx
│  └─ src/
│     ├─ pages/           # Home, Login, Register, Chat, History
│     ├─ components/      # Navbar, ProtectedRoute
│     └─ context/         # AuthContext (sesión con JWT)
└─ backend/               # Express + Mongoose
   └─ src/
      ├─ services/ai.js   # cliente del modelo de IA
      ├─ models/          # User, Conversation
      ├─ routes/          # auth, chat, conversations
      └─ middleware/      # auth (JWT)
```

## Levantar todo con un comando

```bash
docker compose up --build
```

- App: **http://localhost:8081**
- API: **http://localhost:4000/api/health**

Regístrate, entra al **Chat**, elige un modo y practica (por voz o texto). Pulsa
"Guardar" para conservar la conversación en **Mi historial**.

> La voz (micrófono y lectura en voz alta) funciona mejor en **Chrome o Edge**.

Para detener: `docker compose down` · Para borrar también los datos: `docker compose down -v`

## API

| Método | Ruta                    | Auth | Descripción                       |
|--------|-------------------------|------|-----------------------------------|
| POST   | `/api/auth/register`    | —    | Crear cuenta                      |
| POST   | `/api/auth/login`       | —    | Iniciar sesión                    |
| GET    | `/api/auth/me`          | ✔    | Usuario actual                    |
| POST   | `/api/chat`             | ✔    | Enviar mensajes y recibir respuesta de IA |
| GET    | `/api/conversations`    | ✔    | Listar conversaciones guardadas   |
| POST   | `/api/conversations`    | ✔    | Guardar una conversación          |
| DELETE | `/api/conversations/:id`| ✔    | Eliminar una conversación         |

---
Por **Francisco Nieto** — Desarrollador Full Stack.
