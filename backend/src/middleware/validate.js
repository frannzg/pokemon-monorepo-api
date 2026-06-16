export const validatePokemonInput = (req, res, next) => {
  const { title, types } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (!types || !Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ message: 'At least one type is required' });
  }
  if (title.trim().length > 40) {
    return res.status(400).json({ message: 'Name too long (max 40 characters)' });
  }
  next();
};
