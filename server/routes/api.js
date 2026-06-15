const express = require('express');
const rateLimit = require('express-rate-limit');
const mediaController = require('../controllers/mediaController');

const router = express.Router();

// Rate limiting setup
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const infoLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many metadata requests. Please wait a minute before fetching again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const downloadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many download requests. Please wait a minute before starting another download.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply general limiter to all API routes
router.use(generalLimiter);

// Endpoints
router.post('/info', infoLimiter, mediaController.getMediaInfo);
router.post('/download', downloadLimiter, mediaController.startDownload);
router.get('/download/progress/:id', mediaController.getDownloadProgress);
router.post('/download/cancel/:id', mediaController.cancelDownload);
router.get('/download/file/:id', mediaController.deliverFile);

module.exports = router;
