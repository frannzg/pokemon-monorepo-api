import mongoose from 'mongoose';

const externalDataSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    rawData: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('ExternalData', externalDataSchema);
