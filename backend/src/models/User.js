import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Tope diario de mensajes de chat
    dailyChatCount: { type: Number, default: 0 },
    dailyChatDate: { type: String, default: '' }, // YYYY-MM-DD
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
