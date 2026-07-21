import { useLocation } from 'react-router-dom'
import ImageGenerator from '../components/ImageGenerator.jsx'

export default function Studio() {
  const location = useLocation()
  const initial = location.state?.prompt || ''
  return (
    <div className="container">
      <div className="page-head">
        <h1>Studio</h1>
        <p>Genera imágenes con IA. Cada una se guarda automáticamente en tu galería.</p>
      </div>
      <ImageGenerator initialPrompt={initial} />
    </div>
  )
}
