import mongoose from 'mongoose';

const externalDataSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    rawData: { type: Object, default: {} },
  },
  { timestamps: true }
);

externalDataSchema.index({ title: 1 });
externalDataSchema.index({ description: 1 });
externalDataSchema.index({ createdAt: -1 });

export default mongoose.model('ExternalData', externalDataSchema);
