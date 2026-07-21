import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Conversation from '../models/Conversation.js'
import { auth, signToken } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'

const router = Router()
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email })

// --- Registro ---
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) return res.status(400).json({ error: 'Faltan campos.' })
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash })
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) })
  } catch {
    res.status(500).json({ error: 'Error en el registro.' })
  }
})

// --- Login ---
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Faltan campos.' })
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas.' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas.' })
    res.json({ token: signToken(user._id), user: publicUser(user) })
  } catch {
    res.status(500).json({ error: 'Error en el login.' })
  }
})

// --- Usuario actual ---
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('name email')
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })
  res.json({ user: publicUser(user) })
})

// --- Recuperación de contraseña (versión de portafolio, SIN verificación por email) ---
// NOTA DE SEGURIDAD: en un producto real esto DEBE verificar la identidad del
// usuario (enlace/código enviado a su correo). Aquí, por no tener servicio de
// correo, solo comprobamos que el email exista y permitimos el cambio directo.

// Paso 1: ¿el email está registrado?
router.post('/check-email', authLimiter, async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Ingresa tu email.' })
  const exists = !!(await User.findOne({ email: email.toLowerCase() }))
  res.json({ exists })
})

// Paso 2: cambiar la contraseña si el email existe
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos.' })
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(404).json({ error: 'No existe una cuenta con ese email.' })

    user.passwordHash = await bcrypt.hash(password, 10)
    await user.save()
    res.json({ ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
  } catch {
    res.status(500).json({ error: 'No se pudo cambiar la contraseña.' })
  }
})

// --- Eliminar cuenta (y todos sus datos) ---
router.delete('/account', auth, async (req, res) => {
  try {
    await Conversation.deleteMany({ user: req.userId })
    await User.findByIdAndDelete(req.userId)
    res.json({ ok: true, message: 'Cuenta eliminada.' })
  } catch {
    res.status(500).json({ error: 'No se pudo eliminar la cuenta.' })
  }
})

export default router
