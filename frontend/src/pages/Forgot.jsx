import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { checkEmail, resetPassword } from '../api.js'

export default function Forgot() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const verify = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const r = await checkEmail(email)
      if (r.exists) setStep(2)
      else setErr('No existe una cuenta con ese email.')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const change = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const r = await resetPassword(email, password)
      setOk(r.message || 'Contraseña actualizada.')
      setTimeout(() => nav('/login'), 1600)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      {step === 1 ? (
        <form className="auth-card" onSubmit={verify}>
          <h2>Recuperar contraseña</h2>
          <p className="switch" style={{ marginBottom: 6 }}>Ingresa tu email para continuar.</p>
          <input type="email" placeholder="Tu email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn primary full" disabled={busy}>{busy ? 'Verificando…' : 'Continuar'}</button>
          {err && <div className="form-msg error">{err}</div>}
          <p className="switch"><Link to="/login">Volver a iniciar sesión</Link></p>
        </form>
      ) : (
        <form className="auth-card" onSubmit={change}>
          <h2>Nueva contraseña</h2>
          <p className="switch" style={{ marginBottom: 6 }}>Cuenta encontrada: <b>{email}</b></p>
          <input type="password" placeholder="Nueva contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn primary full" disabled={busy || !!ok}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
          {err && <div className="form-msg error">{err}</div>}
          {ok && <div className="form-msg" style={{ color: 'var(--green)' }}>{ok}</div>}
        </form>
      )}
    </div>
  )
}
