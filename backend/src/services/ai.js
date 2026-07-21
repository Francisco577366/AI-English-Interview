// Cliente del modelo de texto (Pollinations.ai — API abierta, sin key).
// Endpoint compatible con OpenAI: POST https://text.pollinations.ai/openai
//
// NOTA: el modelo "openai" pasó a ser un tier de pago (responde 402). El modelo
// gratuito/anónimo que funciona es "openai-fast". Además la API anónima puede dar
// bajones puntuales (402/429), así que reintentamos y, si todo falla, usamos como
// plan B el endpoint simple GET (que es anónimo y no requiere key).
const RAW_ENDPOINT = process.env.AI_ENDPOINT || 'https://text.pollinations.ai/openai'
const RAW_MODEL = process.env.AI_MODEL || 'openai-fast'
const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '15000', 10)
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '3', 10)

// Si defines AI_API_KEY (Groq, OpenRouter, Gemini-compat, etc.) se envía la
// cabecera Authorization al proveedor principal.
const API_KEY = process.env.AI_API_KEY || ''
const USING_KEY = !!API_KEY

// Resuelve el proveedor final de forma PURA (sin mutar estado de módulo). Auto-corrige
// un error común: poner una API key pero dejar el endpoint gratuito de Pollinations
// (que no usa key). La key solo sirve con su proveedor, así que lo deducimos por su prefijo.
function resolveProvider(endpoint, model, key) {
  const genericModel = /^openai(-fast)?$/.test(model)
  if (key && /text\.pollinations\.ai/i.test(endpoint)) {
    if (key.startsWith('gsk_')) {
      return { endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: genericModel ? 'llama-3.3-70b-versatile' : model, corrected: 'Groq' }
    }
    if (key.startsWith('sk-or-')) {
      return { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: genericModel ? 'meta-llama/llama-3.3-70b-instruct:free' : model, corrected: 'OpenRouter' }
    }
  }
  return { endpoint, model, corrected: null }
}

const { endpoint: ENDPOINT, model: MODEL, corrected } = resolveProvider(RAW_ENDPOINT, RAW_MODEL, API_KEY)
if (corrected) {
  console.warn(`⚠️  Detecté una key de ${corrected} con el endpoint de Pollinations → corrijo a ${corrected} automáticamente. Ajusta tu .env para dejarlo limpio.`)
}

// Log de diagnóstico al arrancar: muestra qué proveedor se usa (sin filtrar la key).
console.log(`🤖 IA → endpoint: ${ENDPOINT} · modelo: ${MODEL} · ${USING_KEY ? 'CON API key ✅' : 'SIN key (Pollinations anónimo)'}`)

// Estados que consideramos "temporales" y por los que vale la pena reintentar.
const TRANSIENT = new Set([402, 408, 429, 500, 502, 503, 504])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

// ---- Extracción robusta del texto (soporta content, arrays y tool_calls/harmony) ----
function stripMarkers(s) {
  return String(s)
    .replace(/<\|[^|]*\|>/g, ' ')
    .replace(/\bassistant\s*final\b/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function pickString(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  if (!s) return ''
  if (s[0] === '{' || s[0] === '[') {
    try {
      const o = JSON.parse(s)
      if (o && typeof o === 'object') {
        for (const k of ['content', 'message', 'text', 'response', 'answer', 'reply', 'output']) {
          if (typeof o[k] === 'string' && o[k].trim()) return o[k].trim()
        }
        return ''
      }
    } catch {
      /* no era JSON: se usa tal cual */
    }
  }
  return s
}

function extractReply(data) {
  const msg = data?.choices?.[0]?.message
  if (!msg) return ''
  if (typeof msg.content === 'string' && msg.content.trim()) return stripMarkers(msg.content)
  if (Array.isArray(msg.content)) {
    const joined = msg.content.map((b) => (typeof b === 'string' ? b : b?.text || '')).join('')
    if (joined.trim()) return stripMarkers(joined)
  }
  if (Array.isArray(msg.tool_calls)) {
    const parts = msg.tool_calls.map((tc) => pickString(tc?.function?.arguments)).filter(Boolean)
    if (parts.length) return stripMarkers(parts.join('\n'))
  }
  return ''
}

function parseBody(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return ''
  if (trimmed[0] === '{' || trimmed[0] === '[') {
    try {
      const reply = extractReply(JSON.parse(trimmed))
      return reply || ''
    } catch {
      /* no era JSON válido */
    }
  }
  return stripMarkers(trimmed) // texto plano
}

// ---- Plan B: Pollinations anónimo (sin key). Funciona desde regiones donde un
// proveedor con key (p. ej. Groq) esté bloqueado por IP/país (403). ----
const POLLI_ENDPOINT = 'https://text.pollinations.ai/openai'
const POLLI_MODEL = 'openai-fast'

// B1: POST estilo OpenAI a Pollinations (mejor calidad, mantiene el historial).
async function polliPost(messages) {
  const res = await fetchWithTimeout(POLLI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: POLLI_MODEL, messages, temperature: 0.7 }),
  })
  if (!res.ok) throw new Error('pollinations ' + res.status)
  const reply = parseBody(await res.text())
  if (!reply) throw new Error('pollinations vacío')
  return reply
}

// B2: endpoint simple GET de Pollinations (último recurso, texto plano).
async function getFallback(messages) {
  const system = messages.find((m) => m.role === 'system')?.content || ''
  const convo = messages
    .filter((m) => m.role !== 'system')
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')
  const prompt = (convo + '\nAssistant:').slice(-1500) // evita URLs demasiado largas
  const url =
    'https://text.pollinations.ai/' +
    encodeURIComponent(prompt) +
    `?model=${encodeURIComponent(POLLI_MODEL)}` +
    (system ? `&system=${encodeURIComponent(system.slice(-1000))}` : '')
  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error('fallback ' + res.status)
  const reply = parseBody(await res.text())
  if (!reply) throw new Error('fallback vacío')
  return reply
}

export async function chatComplete(messages) {
  let lastErr = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(USING_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 }),
      })

      if (!res.ok) {
        lastErr = new Error('Error del proveedor de IA (' + res.status + ')')
        // Solo reintentamos errores temporales. 401/403 (auth/región) son
        // permanentes: no insistimos, vamos directo al plan B.
        if (TRANSIENT.has(res.status) && attempt < MAX_RETRIES - 1) {
          await sleep(500 * (attempt + 1))
          continue
        }
        break
      }

      const reply = parseBody(await res.text())
      if (reply) return reply
      lastErr = new Error('Respuesta vacía de la IA')
      if (attempt < MAX_RETRIES - 1) {
        await sleep(400)
        continue
      }
      break
    } catch (e) {
      lastErr = e
      // AbortError (timeout) o error de red: reintenta.
      if (attempt < MAX_RETRIES - 1) {
        await sleep(500 * (attempt + 1))
        continue
      }
    }
  }

  // Plan B: Pollinations anónimo. Se intenta SIEMPRE (incluso con key), para que
  // si el proveedor con key falla o bloquea la región, el chat siga funcionando.
  if (lastErr && USING_KEY) console.warn('⚠️  El proveedor con key falló (' + lastErr.message + '); usando Pollinations como respaldo.')
  try { return await polliPost(messages) } catch { /* sigue */ }
  try { return await getFallback(messages) } catch { /* sigue */ }
  throw lastErr || new Error('No se pudo obtener respuesta de la IA.')
}
