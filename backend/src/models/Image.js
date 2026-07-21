import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    prompt: { type: String, required: true },
    style: { type: String, default: '' },
    ratio: { type: String, default: '' },
    url: { type: String, required: true },
  },
  { timestamps: true },
)

export default mongoose.model('Image', imageSchema)
