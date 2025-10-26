import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/projects', require('./routes/projects').default);
app.use('/api/v1/providers', require('./routes/providers').default);
app.use('/api/v1/threads', require('./routes/threads').default);
app.use('/api/v1/candidates', require('./routes/candidates').default);
app.use('/api/v1/webhooks', require('./routes/webhooks').default);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
