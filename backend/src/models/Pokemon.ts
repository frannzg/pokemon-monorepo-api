import mongoose, { Schema, Document } from 'mongoose';

export interface IPokemonDocument extends Document {
  pokemonId: string;
  name: string;
  types: string;
  rawData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const pokemonSchema = new Schema<IPokemonDocument>(
  {
    pokemonId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    types: { type: String, default: '' },
    rawData: { type: Object, default: {} },
  },
  { timestamps: true, collection: 'externaldatas' }
);

pokemonSchema.index({ name: 1 });
pokemonSchema.index({ types: 1 });
pokemonSchema.index({ createdAt: -1 });

export default mongoose.model<IPokemonDocument>('Pokemon', pokemonSchema);
