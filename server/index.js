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

// Production CORS Configuration
const allowedOrigins = [
  'https://naveenk7100-ship-it.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || allowed === '*')) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS policy blocked request from: ${origin}`));
    }
    return callback(null, true);
  },
  credentials: true
}));

// Production Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request Timeout (35 seconds)
app.use((req, res, next) => {
  req.setTimeout(35000, () => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timeout. The server took too long to respond.' });
    }
  });
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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

// Centralized sanitized error handler
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('Unhandled server error:', isProd ? err.message : err);
  res.status(err.status || 500).json({
    error: isProd ? (err.message || 'Internal Server Error') : err.message,
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
