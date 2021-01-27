import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  appeal_id: {
    type: Number,
    required: true,
  },
  message_ts: {
    type: String,
    required: true,
  },
});

export default mongoose.model('Appeal', callSchema);
