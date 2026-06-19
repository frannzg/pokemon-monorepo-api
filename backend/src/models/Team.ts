import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamDocument extends Document {
  name: string;
  pokemonIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeamDocument>(
  {
    name: { type: String, required: true, default: 'Mi equipo' },
    pokemonIds: [{ type: String }],
  },
  { timestamps: true }
);

teamSchema.index({ name: 1 });
teamSchema.index({ updatedAt: -1 });

export default mongoose.model<ITeamDocument>('Team', teamSchema);
