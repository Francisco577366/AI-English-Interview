// Lógica pura para los ejercicios interactivos de gramática.
// Se mantiene separada de la UI para poder probarla sin React.

// Normaliza una respuesta para comparar: minúsculas, sin espacios sobrantes,
// sin signos de puntuación al inicio/fin (conserva apóstrofes internos: don't, it's).
export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '')
}

// ¿La respuesta del usuario coincide con la clave? La clave puede traer
// varias alternativas separadas por "/" o ",".
export function isCorrect(userAns, answerKey) {
  const u = normalize(userAns)
  if (!u) return false
  const opts = String(answerKey || '')
    .split(/[/,]/)
    .map((x) => normalize(x))
    .filter(Boolean)
  return opts.includes(u)
}

function tryParse(str) {
  try {
    const o = JSON.parse(str)
    if (o && typeof o === 'object' && Array.isArray(o.items) && o.items.length) return o
  } catch {
    /* no era JSON válido */
  }
  return null
}

// Extrae los ejercicios de un mensaje de la IA.
// Devuelve { intro, data } o null si el mensaje no trae ejercicios.
// - intro: el texto (explicación) que va ANTES del bloque de ejercicios.
// - data: { topic?, items:[{q, answer, hint?, options?}] }
export function parseExercise(content) {
  const text = String(content || '')

  // 1) Bloque cercado ```exercise / ```json / ``` ... ```
  const fenceRe = /```(?:exercise|json)?\s*\n?([\s\S]*?)```/gi
  let m
  while ((m = fenceRe.exec(text))) {
    const data = tryParse(m[1].trim())
    if (data) {
      return { intro: text.slice(0, m.index).trim(), data }
    }
  }

  // 2) Sin cercar: buscar un objeto JSON que contenga "items"
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start && text.slice(start, end + 1).includes('"items"')) {
    const data = tryParse(text.slice(start, end + 1))
    if (data) return { intro: text.slice(0, start).trim(), data }
  }

  return null
}

// Texto legible para leer en voz alta (sin JSON, sin código, sin **): explicación + preguntas.
export function speakableText(content) {
  const ex = parseExercise(content)
  if (ex) {
    const qs = (ex.data.items || [])
      .map((it, i) => `Number ${i + 1}. ${String(it.q || '').replace(/_+/g, 'blank')}`)
      .join('. ')
    return [ex.intro, qs].filter(Boolean).join('. ')
  }
  // Mensaje normal: quitamos bloques de código y marcas de negrita.
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
