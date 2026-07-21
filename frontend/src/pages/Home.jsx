import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const TRY = [
  'Practicar small talk en inglés',
  'Simular una entrevista técnica',
  'Corregir mi gramática',
]

const STEPS = [
  {
    ic: '🎯',
    t: 'Elige un modo',
    d: 'Práctica de inglés o simulador de entrevista.',
    long: 'Cambia entre práctica de inglés libre y simulador de entrevista de trabajo. Pídele a la IA que converse contigo, que te enseñe un tema o que te ponga actividades — por ejemplo "practica this, these, those y that" — y te arma ejercicios al momento y te los corrige.',
    img: '/como/step1.png',
    video: '/como/step1.mp4',
  },
  {
    ic: '🎙️',
    t: 'Habla o escribe',
    d: 'Usa el micrófono o el teclado.',
    long: 'Usa el micrófono para hablar o simplemente escribe. La IA te entiende en tiempo real y no te corta cuando haces una pausa para pensar — tú decides cuándo terminas de hablar.',
    img: '/como/step2.png',
    video: '/como/step2.mp4',
  },
  {
    ic: '💬',
    t: 'Recibe feedback por voz',
    d: 'Correcciones claras, en texto y voz.',
    long: 'Cuando algo no se dice bien, la IA te muestra la forma correcta y te pide repetirla en voz alta. Ignora la puntuación y solo corrige lo que importa, y todo lo puedes escuchar con un clic.',
    img: '/como/step3.png',
    video: '/como/step3.mp4',
  },
]

export default function Home() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [active, setActive] = useState(0)
  const start = () => nav(user ? '/chat' : '/register')

  return (
    <div className="lum">
      {/* HERO */}
      <section className="lum-hero">
        <div className="lum-badge"><span className="lum-dot" /> NUEVO — PRÁCTICA CON VOZ</div>
        <h1 className="lum-title">
          Practica inglés y entrevistas<br />con un <span className="grad-art">coach de IA</span>
        </h1>
        <p className="lum-sub">
          Conversa por voz o texto con un tutor de inglés y un simulador de entrevistas. Mejora tu fluidez y prepárate para tu próximo trabajo remoto.
        </p>

        <div className="lum-input-bar">
          {user ? (
            <div className="lum-input lum-locked" style={{ color: 'var(--text)' }}>¿List@ para practicar? Entra al chat.</div>
          ) : (
            <div className="lum-input lum-locked">
              <span className="lum-lock">🔒</span>
              <span><Link to="/register">Regístrate</Link> o <Link to="/login">inicia sesión</Link> para empezar a practicar</span>
            </div>
          )}
          <button className="lum-gen" onClick={start}>Empezar →</button>
        </div>

        <div className="lum-try">
          <span className="lum-try-label">Prueba:</span>
          {TRY.map((t) => (
            <button key={t} className="lum-try-chip" onClick={start}>{t}</button>
          ))}
        </div>

        <div className="lum-trust">
          <span className="lum-trust-pill">⚡ Disponible 24/7</span>
          <span className="lum-trust-pill">🎯 2 modos de práctica</span>
          <span className="lum-trust-pill">🎤 Reconocimiento de voz</span>
          <span className="lum-trust-pill">✨ 100% gratis</span>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como" className="lum-section">
        <h2 className="lum-h2">Cómo funciona</h2>
        <p className="lum-section-sub">Haz clic en cada paso para verlo en la app.</p>
        <div className="lum-flow">
          {STEPS.map((s, i) => (
            <button
              type="button"
              className={`lum-flow-step ${active === i ? 'is-active' : ''}`}
              key={s.t}
              onClick={() => setActive(i)}
            >
              <div className="lum-flow-node">
                <span className="lum-flow-ic">{s.ic}</span>
                <span className="lum-flow-num">{i + 1}</span>
              </div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </button>
          ))}
        </div>

        {/* Vista previa del paso seleccionado */}
        <div className="lum-demo" key={active}>
          <div className="lum-demo-text">
            <span className="lum-demo-badge">{STEPS[active].ic} Paso {active + 1}</span>
            <h3>{STEPS[active].t}</h3>
            <p>{STEPS[active].long}</p>
            <button className="lum-btn-primary" onClick={start}>{user ? 'Ir al chat →' : 'Pruébalo gratis →'}</button>
          </div>
          <div className="lum-demo-img">
            <video
              key={active}
              src={STEPS[active].video}
              poster={STEPS[active].img}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="nosotros" className="lum-section">
        <div className="lum-about">
          <div className="lum-about-left">
            <span className="lum-about-badge">SOBRE FLUENTAI</span>
            <h2 className="lum-about-h2">Tu coach personal para <span className="grad-art">hablar con confianza</span></h2>
            <p>FluentAI es un asistente de IA para practicar inglés conversacional y prepararte para entrevistas de trabajo. Habla por voz o escribe, recibe correcciones y feedback, y guarda tus conversaciones para seguir tu progreso.</p>
            <p>Desarrollada de principio a fin como una aplicación full-stack completa — React en el frontend, Node.js y MongoDB en el backend, autenticación segura, y voz con las APIs nativas del navegador.</p>
            <div className="lum-about-actions">
              <button className="lum-btn-primary" onClick={start}>{user ? 'Ir al chat →' : 'Empieza gratis'}</button>
              <a className="lum-btn-ghost" href="https://www.linkedin.com/in/francisco-nieto-760a14233/" target="_blank" rel="noreferrer">LinkedIn →</a>
            </div>
          </div>
          <div className="lum-team">
            <div className="lum-team-card">
              <div className="lum-avatar" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>FN</div>
              <div>
                <div className="lum-team-name">Francisco Nieto</div>
                <div className="lum-team-role">Desarrollador Full Stack · Creador de la app</div>
                <p className="lum-team-desc">Construí FluentAI de extremo a extremo: diseño, frontend, backend, base de datos, autenticación e integración con IA y voz.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
