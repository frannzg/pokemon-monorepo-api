import { Request, Response, NextFunction } from 'express';
import { CreatePokemonBody } from '../types/index.js';

export const validatePokemonInput = (
  req: Request<Record<string, string>, unknown, CreatePokemonBody>,
  res: Response,
  next: NextFunction
): void => {
  const { name, types } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }
  if (!types || !Array.isArray(types) || types.length === 0) {
    res.status(400).json({ message: 'At least one type is required' });
    return;
  }
  if (name.trim().length > 40) {
    res.status(400).json({ message: 'Name too long (max 40 characters)' });
    return;
  }
  next();
};
