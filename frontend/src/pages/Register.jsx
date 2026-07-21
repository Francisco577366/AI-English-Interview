import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const up = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await register(form)
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
        <h2>Crear cuenta</h2>
        <input name="name" placeholder="Tu nombre" value={form.name} onChange={up} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={up} required />
        <input name="password" type="password" placeholder="Contraseña (mín. 6)" value={form.password} onChange={up} required />
        {err && <div className="form-msg error">{err}</div>}
        <button className="btn primary full" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
        <p className="switch">¿Ya tienes cuenta? <Link to="/login">Entrar</Link></p>
      </form>
    </div>
  )
}
