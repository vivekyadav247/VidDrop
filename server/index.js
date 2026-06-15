const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const compression = require('compression');

const apiRoutes  = require('./routes/api');
const fileHelper = require('./utils/fileHelper');

const app  = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// CORS configuration
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin in dev
    if (!IS_PROD && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} is not allowed.`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", IS_PROD ? "" : "'unsafe-eval'"].filter(Boolean),
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// Request compression and body parsing
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Serve frontend in production
if (IS_PROD) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist, { maxAge: '1d' }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = IS_PROD ? 'Internal server error.' : (err.message || 'Internal server error.');
  console.error('[Server] Unhandled error:', err.message);
  res.status(status).json({ error: message });
});

// Start tasks and listen
fileHelper.ensureDownloadsDir();
fileHelper.sweepDownloads(0);

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const TEN_MINUTES     = 10 * 60 * 1000;
setInterval(() => {
  fileHelper.sweepDownloads(TEN_MINUTES);
}, FIFTEEN_MINUTES);

app.listen(PORT, () => {});
