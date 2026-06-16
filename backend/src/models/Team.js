import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Mi equipo' },
    pokemon: [{ type: String }],
  },
  { timestamps: true }
);

teamSchema.index({ name: 1 });
teamSchema.index({ updatedAt: -1 });

export default mongoose.model('Team', teamSchema);
