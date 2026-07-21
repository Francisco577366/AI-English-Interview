import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const up = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(form)
      nav('/chat')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h2>Entrar</h2>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={up} required />
        <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={up} required />
        {err && <div className="form-msg error">{err}</div>}
        <button className="btn primary full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <p className="switch"><Link to="/olvide">¿Olvidaste tu contraseña?</Link></p>
        <p className="switch">¿No tienes cuenta? <Link to="/register">Crear una</Link></p>
      </form>
    </div>
  )
}
