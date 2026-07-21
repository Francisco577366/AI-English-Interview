import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const out = () => {
    logout()
    nav('/')
  }

  return (
    <nav className="lum-nav">
      <Link to="/" className="lum-brand">
        <span className="lum-logo" />
        Fluent<span className="grad-art">AI</span>
      </Link>

      <div className="lum-nav-links">
        {user ? (
          <>
            <Link to="/chat">Chat</Link>
            <Link to="/historial">Mi historial</Link>
            <Link to="/cuenta">Cuenta</Link>
          </>
        ) : (
          <>
            <a href="/#como">Cómo funciona</a>
            <a href="/#nosotros">Sobre</a>
          </>
        )}
      </div>

      <div className="lum-nav-actions">
        {user ? (
          <>
            <span className="lum-hi">Hola, {user.name.split(' ')[0]}</span>
            <button className="lum-btn-ghost" onClick={out}>Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" className="lum-btn-ghost">Iniciar sesión</Link>
            <Link to="/register" className="lum-btn-primary">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
