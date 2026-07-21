import 'dotenv/config' // carga backend/.env si existe (para ejecutar sin Docker)
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { config, isProd } from './config.js'
import { connectDB } from './db.js'
import { generalLimiter } from './middleware/rateLimit.js'
import { openapiSpec } from './docs/openapi.js'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import conversationRoutes from './routes/conversations.js'

const app = express()

// Detrás de un proxy (Render, Fly, nginx) para que el rate-limit lea la IP real
app.set('trust proxy', 1)

// CORS: en producción se restringe al frontend (CLIENT_URL); en local es abierto.
const corsOptions = isProd ? { origin: config.clientUrl.split(',').map((s) => s.trim()) } : {}
app.use(cors(corsOptions))

app.use(express.json({ limit: '1mb' }))

// Documentación interactiva (Swagger UI). Se monta ANTES del rate-limit para que
// los assets de la UI no cuenten contra el límite general.
app.get('/api/openapi.json', (req, res) => res.json(openapiSpec))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'FluentAI API — Docs' }))

app.use('/api', generalLimiter)

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'fluentai-backend', env: config.env }))
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/conversations', conversationRoutes)

connectDB()
  .then(() => app.listen(config.port, () => console.log(`🚀 Backend en el puerto ${config.port} (${config.env})`)))
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message)
    process.exit(1)
  })
