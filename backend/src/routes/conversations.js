import { Router } from 'express'
import Conversation from '../models/Conversation.js'
import { auth } from '../middleware/auth.js'

const router = Router()
router.use(auth)

// Listar conversaciones guardadas MANUALMENTE por el usuario (no la activa)
router.get('/', async (req, res) => {
  const items = await Conversation.find({ user: req.userId, active: { $ne: true } }).sort({ updatedAt: -1 })
  res.json(items)
})

// Obtener la conversación activa (autoguardada) de un modo. Sirve para restaurar
// el chat si el usuario recarga o borra algo por error.
router.get('/active', async (req, res) => {
  const mode = req.query.mode === 'interview' ? 'interview' : 'english'
  const convo = await Conversation.findOne({ user: req.userId, mode, active: true })
  res.json(convo || null)
})

// Autoguardar la conversación activa (upsert: una por usuario+modo).
router.put('/active', async (req, res) => {
  try {
    const { mode = 'english', messages } = req.body || {}
    const m = mode === 'interview' ? 'interview' : 'english'
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'Formato inválido.' })
    const convo = await Conversation.findOneAndUpdate(
      { user: req.userId, mode: m, active: true },
      { $set: { messages, active: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    res.json(convo)
  } catch {
    res.status(500).json({ error: 'No se pudo autoguardar.' })
  }
})

// Guardar una conversación
router.post('/', async (req, res) => {
  try {
    const { mode = 'english', title, messages } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No hay mensajes que guardar.' })
    }
    const auto = messages.find((m) => m.role === 'user')?.content?.slice(0, 48) || 'Conversación'
    const convo = await Conversation.create({ user: req.userId, mode, title: title || auto, messages })
    res.status(201).json(convo)
  } catch {
    res.status(500).json({ error: 'No se pudo guardar la conversación.' })
  }
})

// Obtener UNA conversación (Read one)
router.get('/:id', async (req, res) => {
  try {
    const convo = await Conversation.findOne({ _id: req.params.id, user: req.userId })
    if (!convo) return res.status(404).json({ error: 'No encontrada.' })
    res.json(convo)
  } catch {
    res.status(400).json({ error: 'ID inválido.' })
  }
})

// Renombrar / actualizar el título (Update)
router.patch('/:id', async (req, res) => {
  try {
    const title = (req.body?.title || '').trim()
    if (!title) return res.status(400).json({ error: 'El título no puede estar vacío.' })
    const convo = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: req.userId, active: { $ne: true } },
      { $set: { title: title.slice(0, 80) } },
      { new: true },
    )
    if (!convo) return res.status(404).json({ error: 'No encontrada.' })
    res.json(convo)
  } catch {
    res.status(400).json({ error: 'No se pudo actualizar.' })
  }
})

// Eliminar (Delete)
router.delete('/:id', async (req, res) => {
  try {
    const convo = await Conversation.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!convo) return res.status(404).json({ error: 'No encontrada.' })
    res.json({ ok: true })
  } catch {
    res.status(400).json({ error: 'ID inválido.' })
  }
})

export default router
