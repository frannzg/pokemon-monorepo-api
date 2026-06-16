import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import externalDataRoutes from './routes/externalData.routes.js';
import teamRoutes from './routes/team.routes.js';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use(cors());
app.use(express.json());
app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/external-data', externalDataRoutes);
app.use('/api/teams', teamRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

export default app;
