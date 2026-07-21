import { useState } from 'react'
import { saveImage } from '../api.js'

const STYLES = [
  { id: 'realista', label: 'Realista', suffix: ', ultra realistic photography, high detail, 4k, sharp focus' },
  { id: 'digital', label: 'Arte digital', suffix: ', digital art, vibrant colors, trending on artstation' },
  { id: '3d', label: '3D render', suffix: ', 3d render, octane render, cinematic lighting' },
  { id: 'anime', label: 'Anime', suffix: ', anime style, detailed, studio quality' },
  { id: 'pixel', label: 'Pixel art', suffix: ', pixel art, 16-bit, retro game style' },
  { id: 'acuarela', label: 'Acuarela', suffix: ', watercolor painting, soft pastel colors' },
]
const RATIOS = [
  { id: 'cuadrado', label: 'Cuadrado', w: 1024, h: 1024 },
  { id: 'horizontal', label: 'Horizontal', w: 1280, h: 768 },
  { id: 'vertical', label: 'Vertical', w: 768, h: 1280 },
]
const IDEAS = [
  'un zorro astronauta flotando entre estrellas',
  'una ciudad futurista al atardecer con autos voladores',
  'un bosque encantado con luces mágicas y niebla',
  'un robot vintage sirviendo café en una cafetería',
  'una montaña reflejada en un lago cristalino al amanecer',
  'un dragón hecho de cristal y luz neón',
  'un gato samurái en un jardín japonés bajo la lluvia',
]

export default function ImageGenerator({ initialPrompt = '' }) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [style, setStyle] = useState(STYLES[0])
  const [ratio, setRatio] = useState(RATIOS[0])
  const [images, setImages] = useState([])

  const generate = () => {
    const text = prompt.trim()
    if (!text) return
    const seed = Math.floor(Math.random() * 1_000_000)
    const enc = encodeURIComponent(text + style.suffix)
    const url = `https://image.pollinations.ai/prompt/${enc}?width=${ratio.w}&height=${ratio.h}&nologo=true&seed=${seed}&model=flux`
    setImages((prev) => [{ id: seed, url, prompt: text, style: style.label, ratio: ratio.label, loading: true, error: false, saved: false }, ...prev])
  }

  const onLoad = (item) => {
    setImages((p) => p.map((im) => (im.id === item.id ? { ...im, loading: false } : im)))
    // Guardar automáticamente en la galería del usuario
    saveImage({ prompt: item.prompt, style: item.style, ratio: item.ratio, url: item.url })
      .then(() => setImages((p) => p.map((im) => (im.id === item.id ? { ...im, saved: true } : im))))
      .catch(() => {})
  }
  const onError = (id) => setImages((p) => p.map((im) => (im.id === id ? { ...im, loading: false, error: true } : im)))
  const surprise = () => setPrompt(IDEAS[Math.floor(Math.random() * IDEAS.length)])

  return (
    <>
      <div className="panel">
        <label className="lbl">Tu idea</label>
        <div className="prompt-row">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ej: un zorro astronauta flotando entre estrellas…" rows={2} />
          <button className="dice" onClick={surprise} title="Sorpréndeme">🎲</button>
        </div>
        <label className="lbl">Estilo</label>
        <div className="chips">
          {STYLES.map((s) => (
            <button key={s.id} className={`chip ${style.id === s.id ? 'active' : ''}`} onClick={() => setStyle(s)}>{s.label}</button>
          ))}
        </div>
        <label className="lbl">Formato</label>
        <div className="chips">
          {RATIOS.map((r) => (
            <button key={r.id} className={`chip ${ratio.id === r.id ? 'active' : ''}`} onClick={() => setRatio(r)}>{r.label}</button>
          ))}
        </div>
        <button className="generate" onClick={generate} disabled={!prompt.trim()}>Generar imagen ✦</button>
      </div>

      <div className="gallery">
        {images.map((im) => (
          <figure className="card" key={im.id}>
            {im.loading && (
              <div className="loading"><div className="spinner" /><span>Generando…</span></div>
            )}
            {im.error ? (
              <div className="err">No se pudo generar. Intenta de nuevo.</div>
            ) : (
              <img src={im.url} alt={im.prompt} onLoad={() => onLoad(im)} onError={() => onError(im.id)} style={{ display: im.loading ? 'none' : 'block' }} />
            )}
            {!im.loading && !im.error && (
              <figcaption>
                <span className="cap-text">{im.prompt}</span>
                {im.saved && <span className="saved">✓ guardada</span>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </>
  )
}
