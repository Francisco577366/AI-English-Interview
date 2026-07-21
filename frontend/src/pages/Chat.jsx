import { useEffect, useRef, useState } from 'react'
import { sendChat, saveConversation, getActiveConversation, saveActiveConversation } from '../api.js'
import { parseExercise, isCorrect, speakableText } from '../lib/exercises.js'

const MODES = {
  english: {
    label: 'Práctica de inglés',
    greeting: "Hi! I'm Lumi, your English tutor. What would you like to talk about today? You can also ask me to practice a grammar topic — e.g. \"I need to practice this, these, those and that\".",
  },
  interview: {
    label: 'Simulador de entrevista',
    greeting: "Hello! I'm Alex, your interviewer today. Let's begin — tell me a bit about yourself and your experience as a developer.",
  },
}

const lsKey = (m) => `fluentai_active_${m}`
const greetingMsgs = (m) => [{ role: 'assistant', content: MODES[m].greeting }]

function loadLocal(m) {
  try {
    const raw = localStorage.getItem(lsKey(m))
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (Array.isArray(arr) && arr.length) return arr
  } catch {}
  return null
}

// Una conversación es válida para un modo SOLO si empieza con el saludo de ESE modo.
// Así detectamos (y limpiamos) datos corruptos que se hayan mezclado entre modos.
function belongsTo(msgs, m) {
  return Array.isArray(msgs) && msgs[0]?.role === 'assistant' && msgs[0]?.content === MODES[m].greeting
}
function loadValid(m) {
  const arr = loadLocal(m)
  if (belongsTo(arr, m)) return arr
  if (arr) { try { localStorage.removeItem(lsKey(m)) } catch {} } // descarta lo corrupto
  return null
}

// Texto con **negritas** y saltos de línea.
function TextBlock({ text }) {
  const lines = String(text || '').split('\n')
  return (
    <>
      {lines.map((line, li) => (
        <span key={li}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
            /^\*\*[^*]+\*\*$/.test(part) ? <strong key={pi}>{part.slice(2, -2)}</strong> : <span key={pi}>{part}</span>,
          )}
          {li < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

// Texto con soporte para bloques de código ```...``` (se ven como código, no con backticks).
function RichText({ text }) {
  const src = String(text || '')
  if (!src.includes('```')) return <TextBlock text={src} />
  const parts = src.split(/```[\w]*\n?([\s\S]*?)```/g)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <pre className="ex-code" key={i}>{p.replace(/\n$/, '')}</pre>
        ) : p ? (
          <TextBlock text={p} key={i} />
        ) : null,
      )}
    </>
  )
}

// Tarjeta de ejercicios interactivos: cada pregunta con su casilla,
// corrección local al pulsar "Revisar" y opción de otra ronda.
function Exercise({ data, onRound, busy }) {
  const items = data?.items || []
  const [answers, setAnswers] = useState(() => items.map(() => ''))
  const [checked, setChecked] = useState(false)

  const setAns = (i, v) => setAnswers((a) => a.map((x, k) => (k === i ? v : x)))
  const results = items.map((it, i) => isCorrect(answers[i], it.answer))
  const score = results.filter(Boolean).length

  return (
    <div className="ex-card">
      {data?.topic && <div className="ex-title">📝 {data.topic}</div>}
      {items.map((it, i) => (
        <div key={i} className={`ex-item ${checked ? (results[i] ? 'ok' : 'bad') : ''}`}>
          <div className="ex-q"><span className="ex-n">{i + 1}.</span> <span><RichText text={it.q} /></span></div>
          {Array.isArray(it.options) && it.options.length ? (
            <div className="ex-opts">
              {it.options.map((op, k) => (
                <button
                  key={k}
                  className={`ex-op ${answers[i] === op ? 'sel' : ''}`}
                  onClick={() => !checked && setAns(i, op)}
                  disabled={checked}
                >
                  {op}
                </button>
              ))}
            </div>
          ) : (
            <input
              className="ex-input"
              placeholder="Tu respuesta…"
              value={answers[i]}
              onChange={(e) => setAns(i, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !checked && setChecked(true)}
              disabled={checked}
            />
          )}
          {checked && (
            <div className={`ex-fb ${results[i] ? 'ok' : 'bad'}`}>
              {results[i] ? '✅ ¡Correcto!' : <>❌ Respuesta: <b>{it.answer}</b></>}
              {it.hint && <span className="ex-hint"> · {it.hint}</span>}
            </div>
          )}
        </div>
      ))}

      <div className="ex-actions">
        {!checked ? (
          <button className="lum-gen" onClick={() => setChecked(true)} disabled={answers.every((a) => !a.trim())}>
            Revisar respuestas
          </button>
        ) : (
          <>
            <span className="ex-score">Puntaje: {score}/{items.length}</span>
            <button className="chip" onClick={() => { setChecked(false); setAnswers(items.map(() => '')) }}>↺ Reintentar</button>
            <button className="chip" onClick={onRound} disabled={busy}>✨ Otra ronda</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const cameFromContinueRef = useRef(false)
  const [mode, setMode] = useState(() => {
    // Si venimos de "Continuar" desde el historial, abrimos ese modo y marcamos
    // que NO se debe pisar la conversación elegida con la del backend.
    try {
      const m = localStorage.getItem('fluentai_open_mode')
      if (m) { localStorage.removeItem('fluentai_open_mode'); cameFromContinueRef.current = true; if (m === 'english' || m === 'interview') return m }
    } catch {}
    return 'english'
  })
  // Conversaciones SEPARADAS por modo (inglés / entrevista) para que NUNCA se mezclen.
  const [convos, setConvos] = useState(() => ({
    english: loadValid('english') || greetingMsgs('english'),
    interview: loadValid('interview') || greetingMsgs('interview'),
  }))
  const messages = convos[mode] // derivado: siempre en sync con el modo actual
  const setMsgs = (updater) =>
    setConvos((c) => {
      const cur = c[mode]
      const next = typeof updater === 'function' ? updater(cur) : updater
      return { ...c, [mode]: next }
    })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [saved, setSaved] = useState(false)
  const [note, setNote] = useState('')
  const [speakingId, setSpeakingId] = useState(null) // qué burbuja está sonando (o 'auto')
  const recRef = useRef(null)
  const finalTextRef = useRef('')
  const endRef = useRef(null)
  const backupRef = useRef({ english: convos.english, interview: convos.interview }) // red de seguridad POR modo
  const saveTimerRef = useRef(null)

  const speechSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  // Al cambiar de modo, sincroniza SOLO ese modo con el backend (por si otro
  // dispositivo tiene una versión más completa). Nunca toca el otro modo.
  useEffect(() => {
    const m = mode // capturamos el modo de este efecto
    setSaved(false)
    // Si venimos de "Continuar" desde el historial, la conversación elegida ya está
    // en localStorage; NO la pisamos con la activa anterior del backend.
    if (cameFromContinueRef.current) { cameFromContinueRef.current = false; return }
    let cancelled = false
    getActiveConversation(m)
      .then((convo) => {
        if (cancelled || !convo?.messages?.length) return
        // Solo aceptamos la versión del backend si de verdad pertenece a este modo.
        if (!belongsTo(convo.messages, m)) {
          // El backend tenía datos corruptos (de otro modo): lo reseteamos limpio.
          saveActiveConversation({ mode: m, messages: greetingMsgs(m) }).catch(() => {})
          return
        }
        setConvos((c) => {
          if (convo.messages.length > (c[m]?.length || 0)) {
            try { localStorage.setItem(lsKey(m), JSON.stringify(convo.messages)) } catch {}
            backupRef.current[m] = convo.messages
            return { ...c, [m]: convo.messages }
          }
          return c
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [mode])

  // Autoguardado continuo del modo actual (local al instante, backend con retraso).
  useEffect(() => {
    const cur = messages
    if (cur.length > (backupRef.current[mode]?.length || 0)) backupRef.current[mode] = cur
    if (cur.length < 2) return
    try { localStorage.setItem(lsKey(mode), JSON.stringify(cur)) } catch {}
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveActiveConversation({ mode, messages: cur }).catch(() => {})
    }, 800)
    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current)
  }, [messages, mode])

  const stopSpeak = () => {
    try { window.speechSynthesis?.cancel() } catch {}
    setSpeakingId(null)
  }

  const switchMode = (m) => {
    setMode(m)
    stopSpeak()
  }

  const newChat = () => {
    stopSpeak()
    const fresh = greetingMsgs(mode)
    setMsgs(fresh)
    backupRef.current[mode] = fresh
    setInput('')
    setSaved(false)
    try { localStorage.removeItem(lsKey(mode)) } catch {}
    saveActiveConversation({ mode, messages: fresh }).catch(() => {})
  }

  // Reproduce un texto. id sirve para saber qué burbuja está sonando (o 'auto').
  const speak = (text, id = 'auto') => {
    if (!window.speechSynthesis) return
    const clean = speakableText(text)
    if (!clean) return
    // Cortamos SIEMPRE lo anterior para que no se solape ni repita.
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(clean)
    u.lang = 'en-US'
    u.rate = 1
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur))
    u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur))
    setSpeakingId(id)
    // Pequeño retraso tras cancel(): evita el bug de Chrome que a veces repite/corta.
    setTimeout(() => {
      try { window.speechSynthesis.speak(u) } catch {}
    }, 70)
  }

  // Voz automática de las respuestas: solo si el usuario NO ha muteado.
  const autoSpeak = (text) => {
    if (voiceOn) speak(text, 'auto')
  }

  // Botón de mutear: apaga/enciende y CORTA lo que esté sonando al mutear.
  const toggleVoice = () => {
    setVoiceOn((v) => {
      const next = !v
      if (!next) stopSpeak()
      return next
    })
  }

  const send = async (textArg) => {
    const text = (textArg ?? input).trim()
    if (!text || busy) return
    const bk = backupRef.current[mode]
    const base = bk && bk.length > messages.length ? bk : messages
    const next = [...base, { role: 'user', content: text }]
    setMsgs(next)
    setInput('')
    setBusy(true)
    setSaved(false)
    try {
      const { reply } = await sendChat(mode, next)
      setMsgs((m) => [...m, { role: 'assistant', content: reply }])
      autoSpeak(reply)
    } catch (e) {
      setMsgs((m) => [...m, { role: 'assistant', content: '⚠️ ' + (e.message || 'Error al responder.') }])
    } finally {
      setBusy(false)
    }
  }

  const toggleMic = () => {
    if (!speechSupported) {
      setNote('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
      return
    }
    if (listening) {
      recRef.current?.stop()
      return
    }
    stopSpeak() // que la voz no hable encima mientras tú hablas
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    finalTextRef.current = input ? input.trim() + ' ' : ''

    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalTextRef.current += t + ' '
        else interim += t
      }
      setInput((finalTextRef.current + interim).replace(/\s+/g, ' ').trimStart())
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => {
      setListening(false)
      recRef.current = null
    }
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const save = async () => {
    try {
      await saveConversation({ mode, messages })
      setSaved(true)
    } catch {
      setNote('No se pudo guardar.')
    }
  }

  const roundPrompt = 'Give me another round of exercises on the same topic, a bit harder, in the same format.'

  return (
    <div className="chat-wrap">
      <div className="chat-head">
        <div className="chat-modes">
          {Object.entries(MODES).map(([k, v]) => (
            <button key={k} className={`chip ${mode === k ? 'active' : ''}`} onClick={() => switchMode(k)}>{v.label}</button>
          ))}
        </div>
        <div className="chat-tools">
          <button className={`chip ${voiceOn ? '' : 'muted'}`} onClick={toggleVoice} title={voiceOn ? 'Silenciar la voz' : 'Activar la voz'}>{voiceOn ? '🔊 Voz' : '🔇 Silenciada'}</button>
          <button className="chip" onClick={newChat} title="Empezar de nuevo">✨ Nueva</button>
          <button className="chip" onClick={save} disabled={messages.length < 2}>{saved ? '✓ Guardada' : '💾 Guardar'}</button>
        </div>
      </div>

      <div className="chat-box">
        {messages.map((m, i) => {
          const ex = m.role === 'assistant' ? parseExercise(m.content) : null
          return (
            <div key={i} className={`msg ${m.role}`}>
              <div className="bubble">
                {ex ? (
                  <>
                    {ex.intro && <div className="ex-intro"><RichText text={ex.intro} /></div>}
                    <Exercise data={ex.data} busy={busy} onRound={() => send(roundPrompt)} />
                  </>
                ) : (
                  <RichText text={m.content} />
                )}
                {m.role === 'assistant' && window.speechSynthesis && (
                  <button
                    className="speak"
                    onClick={() => (speakingId === i ? stopSpeak() : speak(m.content, i))}
                    title={speakingId === i ? 'Detener' : 'Escuchar'}
                  >
                    {speakingId === i ? '⏹️' : '🔈'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {busy && (
          <div className="msg assistant"><div className="bubble typing"><span></span><span></span><span></span></div></div>
        )}
        <div ref={endRef} />
      </div>

      {note && <div className="chat-note">{note}</div>}

      <div className="chat-input-bar">
        <button className={`mic ${listening ? 'on' : ''}`} onClick={toggleMic} title="Hablar">🎤</button>
        <input
          className="chat-input"
          placeholder={listening ? '🎙️ Escuchando… habla con calma y pulsa el micro para terminar' : mode === 'interview' ? 'Responde la pregunta…' : 'Escribe, habla o pide practicar un tema…'}
          value={input}
          onChange={(e) => {
            const v = e.target.value
            setInput(v)
            // Si el usuario edita o borra el texto mientras graba, sincronizamos el
            // buffer de voz para NO "regenerar" lo anterior al seguir hablando.
            if (listening) finalTextRef.current = v ? v.replace(/\s+$/, '') + ' ' : ''
          }}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={busy}
        />
        <button className="lum-gen" onClick={() => send()} disabled={busy || !input.trim()}>Enviar</button>
      </div>
    </div>
  )
}
