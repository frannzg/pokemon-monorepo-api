import ExternalData from '../models/ExternalData.js';
import { fetchExternalData } from '../services/externalApi.service.js';

export const getStoredData = async (req, res) => {
  try {
    const data = await ExternalData.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const syncExternalData = async (req, res) => {
  try {
    const externalData = await fetchExternalData();

    const operations = externalData.map((item) => ({
      updateOne: {
        filter: { externalId: item.externalId },
        update: { $set: item },
        upsert: true,
      },
    }));

    await ExternalData.bulkWrite(operations);

    res.json({ message: 'Data synchronized', count: externalData.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStoredDataById = async (req, res) => {
  try {
    const data = await ExternalData.findOne({ externalId: req.params.externalId });
    if (!data) return res.status(404).json({ message: 'Pokemon not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStoredData = async (req, res) => {
  try {
    await ExternalData.deleteMany({});
    res.json({ message: 'All data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
