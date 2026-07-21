import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getImages, deleteImage } from '../api.js'

export default function Gallery() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    getImages()
      .then(setImages)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  const remove = async (id) => {
    try {
      await deleteImage(id)
      setImages((p) => p.filter((i) => i._id !== id))
    } catch {
      /* noop */
    }
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Mi galería</h1>
        <p>Todas las imágenes que has generado, guardadas en tu cuenta.</p>
      </div>

      {loading && <div className="center-msg">Cargando…</div>}
      {err && <div className="center-msg">{err}</div>}
      {!loading && !err && images.length === 0 && (
        <div className="empty">
          <div className="empty-ic">🖼️</div>
          <p>Aún no tienes imágenes. Ve al <Link to="/studio">Studio</Link> y crea la primera.</p>
        </div>
      )}

      <div className="gallery">
        {images.map((im) => (
          <figure className="card" key={im._id}>
            <img src={im.url} alt={im.prompt} loading="lazy" />
            <figcaption>
              <span className="cap-text">{im.prompt}</span>
              <button className="del" onClick={() => remove(im._id)} title="Eliminar">🗑</button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
