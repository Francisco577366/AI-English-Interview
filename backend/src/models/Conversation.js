import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { _id: false },
)

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mode: { type: String, enum: ['english', 'interview'], default: 'english' },
    title: { type: String, default: 'Conversación' },
    messages: { type: [messageSchema], default: [] },
    // Conversación "activa": la que se autoguarda mientras el usuario chatea.
    // Hay como máximo una por (usuario, modo). Las guardadas manualmente son active:false.
    active: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model('Conversation', conversationSchema)
