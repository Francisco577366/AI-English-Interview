import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function signToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' })
}

// Middleware: verifica el token JWT del header Authorization: Bearer <token>
export function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.userId = payload.id
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
