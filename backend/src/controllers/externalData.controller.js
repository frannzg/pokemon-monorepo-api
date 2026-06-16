import ExternalData from '../models/ExternalData.js';
import { fetchExternalData } from '../services/externalApi.service.js';

export const getStoredData = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 60, sort } = req.query;
    const filter = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (type) {
      const types = type.split(',').map(t => t.trim()).filter(Boolean);
      if (types.length === 1) {
        filter.description = { $regex: types[0], $options: 'i' };
      } else if (types.length > 1) {
        filter.$and = types.map(t => ({ description: { $regex: t, $options: 'i' } }));
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 60));
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { title: 1 };
    if (sort === 'id') sortOption = { externalId: 1 };

    const [data, total] = await Promise.all([
      ExternalData.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      ExternalData.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
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
