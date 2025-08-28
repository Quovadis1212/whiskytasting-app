import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import tastingRouter from './routes/tastings.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(','), credentials: true }));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/tastings', tastingRouter);

// DB connect & start
const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { dbName: 'whiskytasting' })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => console.log(`API on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });
