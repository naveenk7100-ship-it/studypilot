import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health / root endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'StudyPilot Server', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api', apiRouter);

// Serve frontend static build in production
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use('/studypilot', express.static(clientDistPath));
app.use(express.static(clientDistPath));

// Fallback to client index.html for SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('StudyPilot Server is running. Client build will be served here.');
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 StudyPilot Server running on port ${PORT}`);
  console.log(`   API Endpoint: http://localhost:${PORT}/api/status`);
  console.log(`   AI Provider:  ${process.env.AI_PROVIDER || 'demo'}`);
  console.log(`========================================\n`);
});
