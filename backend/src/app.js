import express from 'express';
import cors from 'cors';
import externalDataRoutes from './routes/externalData.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/external-data', externalDataRoutes);

export default app;
