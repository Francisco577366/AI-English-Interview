import { Router } from 'express'
import Image from '../models/Image.js'
import { auth } from '../middleware/auth.js'

const router = Router()

// Todas las rutas de imágenes requieren autenticación
router.use(auth)

// Listar las imágenes del usuario (más recientes primero)
router.get('/', async (req, res) => {
  const images = await Image.find({ user: req.userId }).sort({ createdAt: -1 })
  res.json(images)
})

// Guardar una imagen generada
router.post('/', async (req, res) => {
  try {
    const { prompt, style, ratio, url } = req.body || {}
    if (!prompt || !url) return res.status(400).json({ error: 'Faltan datos de la imagen.' })
    const image = await Image.create({ user: req.userId, prompt, style, ratio, url })
    res.status(201).json(image)
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la imagen.' })
  }
})

// Eliminar una imagen (solo si es del usuario)
router.delete('/:id', async (req, res) => {
  const image = await Image.findOneAndDelete({ _id: req.params.id, user: req.userId })
  if (!image) return res.status(404).json({ error: 'Imagen no encontrada.' })
  res.json({ ok: true })
})

export default router
