import rateLimit from 'express-rate-limit'

const json = (error) => ({ error })

// Límite general para toda la API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
})

// Más estricto en autenticación (evita fuerza bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'),
})

// Límite por ráfaga en el chat (evita spam a la IA)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Vas demasiado rápido. Espera unos segundos.'),
})
