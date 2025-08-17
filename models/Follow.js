// models/Follow.js
import mongoose from 'mongoose'

const FollowSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.models.Follow || mongoose.model('Follow', FollowSchema)
