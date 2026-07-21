// Especificación OpenAPI 3 de la API de FluentAI.
// Se sirve como documentación interactiva (Swagger UI) en /api/docs.
import { config } from '../config.js'

const bearer = [{ bearerAuth: [] }]

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'FluentAI API',
    version: '1.0.0',
    description:
      'API de FluentAI — coach de inglés y simulador de entrevistas con IA.\n\n' +
      'Autenticación con JWT (Bearer). Regístrate o inicia sesión para obtener un token, ' +
      'pulsa **Authorize** y pega el token para probar los endpoints protegidos.',
    contact: { name: 'Francisco Nieto' },
  },
  servers: [{ url: '/', description: config.env }],
  tags: [
    { name: 'Auth', description: 'Registro, login y gestión de cuenta' },
    { name: 'Chat', description: 'Conversación con la IA (inglés / entrevista)' },
    { name: 'Conversaciones', description: 'Historial y autoguardado' },
    { name: 'Sistema', description: 'Estado del servicio' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66a1f2c3d4e5f6a7b8c9d0e1' },
          name: { type: 'string', example: 'Francisco' },
          email: { type: 'string', example: 'fran@example.com' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiInR5cCI6...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Message: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['user', 'assistant'], example: 'user' },
          content: { type: 'string', example: 'Hi! I want to practice English.' },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          mode: { type: 'string', enum: ['english', 'interview'], example: 'english' },
          title: { type: 'string', example: 'Práctica de saludos' },
          active: { type: 'boolean', example: false },
          messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: { type: 'object', properties: { error: { type: 'string', example: 'Mensaje de error.' } } },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del servicio',
        security: [],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'fluentai-backend' },
                    env: { type: 'string', example: 'development' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Crear una cuenta',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Francisco' },
                  email: { type: 'string', example: 'fran@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cuenta creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'El email ya existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'fran@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Sesión iniciada', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Usuario autenticado',
        security: bearer,
        responses: {
          200: { description: 'Datos del usuario', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/check-email': {
      post: {
        tags: ['Auth'],
        summary: 'Comprobar si un email está registrado',
        description: 'Paso 1 de la recuperación de contraseña (versión de portafolio, sin verificación por correo).',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', example: 'fran@example.com' } } } } },
        },
        responses: {
          200: { description: 'Resultado', content: { 'application/json': { schema: { type: 'object', properties: { exists: { type: 'boolean', example: true } } } } } },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Cambiar la contraseña',
        description: 'Paso 2 de la recuperación. Cambia la contraseña si el email existe.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string', minLength: 6 } } } } },
        },
        responses: {
          200: { description: 'Contraseña actualizada', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' } } } } } },
          404: { description: 'El email no existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/account': {
      delete: {
        tags: ['Auth'],
        summary: 'Eliminar la cuenta',
        description: 'Borra el usuario y todas sus conversaciones.',
        security: bearer,
        responses: {
          200: { description: 'Cuenta eliminada', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' } } } } } },
          401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Enviar mensajes a la IA',
        description: 'Envía el historial y recibe la respuesta del coach. Sujeto a un tope diario por usuario.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  mode: { type: 'string', enum: ['english', 'interview'], default: 'english' },
                  messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Respuesta de la IA', content: { 'application/json': { schema: { type: 'object', properties: { reply: { type: 'string' }, remaining: { type: 'integer', example: 42 } } } } } },
          429: { description: 'Límite diario alcanzado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          502: { description: 'La IA no respondió', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/conversations': {
      get: {
        tags: ['Conversaciones'],
        summary: 'Listar conversaciones guardadas',
        security: bearer,
        responses: {
          200: { description: 'Lista', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Conversation' } } } } },
        },
      },
      post: {
        tags: ['Conversaciones'],
        summary: 'Guardar una conversación',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  mode: { type: 'string', enum: ['english', 'interview'] },
                  title: { type: 'string' },
                  messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Guardada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Conversation' } } } },
          400: { description: 'Sin mensajes', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/conversations/active': {
      get: {
        tags: ['Conversaciones'],
        summary: 'Conversación activa (autoguardado)',
        security: bearer,
        parameters: [{ name: 'mode', in: 'query', schema: { type: 'string', enum: ['english', 'interview'], default: 'english' } }],
        responses: {
          200: { description: 'La conversación activa o null', content: { 'application/json': { schema: { $ref: '#/components/schemas/Conversation' } } } },
        },
      },
      put: {
        tags: ['Conversaciones'],
        summary: 'Autoguardar la conversación activa',
        description: 'Upsert: mantiene una sola conversación activa por usuario y modo.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  mode: { type: 'string', enum: ['english', 'interview'] },
                  messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Guardada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Conversation' } } } },
        },
      },
    },
    '/api/conversations/{id}': {
      delete: {
        tags: ['Conversaciones'],
        summary: 'Eliminar una conversación',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Eliminada', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          404: { description: 'No encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
}
