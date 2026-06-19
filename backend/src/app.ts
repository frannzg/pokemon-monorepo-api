import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import pokemonRoutes from './routes/pokemon.routes.js';
import teamRoutes from './routes/team.routes.js';

const app = express();

const allowedOrigins: string[] = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:3000'];

app.use(cors({ origin: allowedOrigins }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use(express.json());
app.use('/api/', limiter);

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3/themes/3.x/theme-monokai.css',
    customSiteTitle: 'Pokemon API Docs',
  })
);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/pokemon', pokemonRoutes);
app.use('/api/teams', teamRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: err.message || 'Internal server error',
  });
});

export default app;
