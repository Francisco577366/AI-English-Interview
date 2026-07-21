// Configuración central leída de variables de entorno.
// Sirve igual en local (.env / docker-compose) y en producción (Atlas + host).
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/fluentai',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  // URL del frontend: se usa para CORS en producción.
  clientUrl: process.env.CLIENT_URL || 'http://localhost:8081',
  // Tope diario de mensajes de chat por usuario (protege la IA gratuita).
  chatDailyLimit: parseInt(process.env.CHAT_DAILY_LIMIT || '50', 10),
}

export const isProd = config.env === 'production'
