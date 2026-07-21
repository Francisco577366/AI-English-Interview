import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getConversations, deleteConversation, renameConversation, saveActiveConversation } from '../api.js'

const MODE_LABEL = { english: 'Inglés', interview: 'Entrevista' }
const fmtDate = (s) => {
  try { return new Date(s).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '' }
}

export default function History() {
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [note, setNote] = useState('')

  useEffect(() => {
    getConversations().then(setItems).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  const shown = useMemo(
    () =>
      items.filter((c) => {
        if (filter !== 'all' && c.mode !== filter) return false
        const q = query.trim().toLowerCase()
        if (q) {
          const inTitle = (c.title || '').toLowerCase().includes(q)
          const inMsgs = c.messages?.some((m) => (m.content || '').toLowerCase().includes(q))
          if (!inTitle && !inMsgs) return false
        }
        return true
      }),
    [items, filter, query],
  )

  // --- Update (renombrar) ---
  const startEdit = (c) => { setEditing(c._id); setEditTitle(c.title || ''); setConfirmDel(null) }
  const saveEdit = async (id) => {
    const t = editTitle.trim()
    if (!t) return
    try {
      const updated = await renameConversation(id, t)
      setItems((p) => p.map((c) => (c._id === id ? { ...c, title: updated.title } : c)))
      setEditing(null)
    } catch (e) { setNote(e.message) }
  }

  // --- Delete (con confirmación en línea) ---
  const doDelete = async (id) => {
    try {
      await deleteConversation(id)
      setItems((p) => p.filter((c) => c._id !== id))
      setConfirmDel(null)
    } catch (e) { setNote(e.message) }
  }

  // --- Continuar en el chat ---
  const continueChat = async (c) => {
    try {
      localStorage.setItem(`fluentai_active_${c.mode}`, JSON.stringify(c.messages))
      localStorage.setItem('fluentai_open_mode', c.mode)
    } catch {}
    // Esperamos a que el backend quede consistente ANTES de navegar, para que el
    // chat no cargue la conversación activa anterior por una condición de carrera.
    try { await saveActiveConversation({ mode: c.mode, messages: c.messages }) } catch {}
    nav('/chat')
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Mi historial</h1>
        <p>Tus conversaciones guardadas. Ábrelas, renómbralas, continúalas o elimínalas.</p>
      </div>

      {!loading && !err && items.length > 0 && (
        <div className="hist-toolbar">
          <input
            className="hist-search"
            placeholder="🔎 Buscar por título o contenido…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="hist-filters">
            {[['all', 'Todas'], ['english', 'Inglés'], ['interview', 'Entrevista']].map(([k, l]) => (
              <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="center-msg">Cargando…</div>}
      {err && <div className="center-msg">{err}</div>}
      {!loading && !err && items.length === 0 && (
        <div className="empty">
          <div className="empty-ic">💬</div>
          <p>Aún no tienes conversaciones. Ve al <Link to="/chat">Chat</Link>, practica y pulsa "💾 Guardar".</p>
        </div>
      )}
      {!loading && !err && items.length > 0 && shown.length === 0 && (
        <div className="center-msg">No hay conversaciones que coincidan con tu búsqueda.</div>
      )}

      {note && <div className="chat-note">{note}</div>}

      <div className="hist-list">
        {shown.map((c) => (
          <div className="hist-card" key={c._id}>
            <div className="hist-top">
              <div className="hist-main" onClick={() => editing !== c._id && setOpen(open === c._id ? null : c._id)}>
                <span className={`hist-tag ${c.mode}`}>{MODE_LABEL[c.mode] || c.mode}</span>
                {editing === c._id ? (
                  <input
                    className="hist-edit"
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(c._id); if (e.key === 'Escape') setEditing(null) }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="hist-title">{c.title}</span>
                )}
              </div>
              <div className="hist-actions">
                <span className="hist-count">{c.messages.length} msj · {fmtDate(c.updatedAt)}</span>
                {editing === c._id ? (
                  <>
                    <button className="hist-ic ok" onClick={() => saveEdit(c._id)} title="Guardar">✓</button>
                    <button className="hist-ic" onClick={() => setEditing(null)} title="Cancelar">✕</button>
                  </>
                ) : confirmDel === c._id ? (
                  <>
                    <span className="hist-confirm">¿Eliminar?</span>
                    <button className="hist-ic danger" onClick={() => doDelete(c._id)} title="Sí, eliminar">Sí</button>
                    <button className="hist-ic" onClick={() => setConfirmDel(null)} title="No">No</button>
                  </>
                ) : (
                  <>
                    <button className="hist-ic" onClick={() => continueChat(c)} title="Continuar en el chat">▶</button>
                    <button className="hist-ic" onClick={() => setOpen(open === c._id ? null : c._id)} title="Ver">{open === c._id ? '▲' : '👁'}</button>
                    <button className="hist-ic" onClick={() => startEdit(c)} title="Renombrar">✏️</button>
                    <button className="hist-ic danger" onClick={() => { setConfirmDel(c._id); setEditing(null) }} title="Eliminar">🗑</button>
                  </>
                )}
              </div>
            </div>
            {open === c._id && (
              <div className="hist-body">
                {c.messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}><div className="bubble">{m.content}</div></div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
