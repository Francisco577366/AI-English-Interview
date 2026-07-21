import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteAccount } from '../api.js'

export default function Account() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const del = async () => {
    setBusy(true)
    setErr('')
    try {
      await deleteAccount()
      logout()
      nav('/')
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Mi cuenta</h1>
        <p>Gestiona tu cuenta de FluentAI.</p>
      </div>

      <div className="acct-card">
        <div className="acct-row"><span>Nombre</span><b>{user?.name}</b></div>
        <div className="acct-row"><span>Email</span><b>{user?.email}</b></div>
      </div>

      <div className="danger-card">
        <h3>Eliminar cuenta</h3>
        <p>Se borrarán tu cuenta y todas tus conversaciones de forma permanente. Esta acción no se puede deshacer.</p>
        <label className="acct-check">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          Entiendo que esto es permanente.
        </label>
        {err && <div className="form-msg error">{err}</div>}
        <button className="btn-danger" onClick={del} disabled={!confirm || busy}>{busy ? 'Eliminando…' : 'Eliminar mi cuenta'}</button>
      </div>
    </div>
  )
}
