const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { corsOrigins, isProd, isTest } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errors');
const { PUBLIC_DIR } = require('./services/storage');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  // Images are fetched by the app and the admin dashboard from other origins.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: corsOrigins(), credentials: true }));
  // Keep the raw body available for Paystack webhook signature checks (milestone 5).
  app.use(express.json({ limit: '1mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
  if (!isTest()) app.use(morgan(isProd() ? 'combined' : 'dev'));
  app.use(
    '/api',
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
      limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300),
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => isTest(),
    })
  );

  app.use('/uploads', express.static(PUBLIC_DIR, { maxAge: '30d', immutable: true, index: false }));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'handyconnect-api', time: new Date().toISOString() }));

  app.use('/api/v1/auth', require('./routes/auth.routes'));
  app.use('/api/v1/users', require('./routes/user.routes'));
  app.use('/api/v1/categories', require('./routes/category.routes'));
  app.use('/api/v1/handymen', require('./routes/handyman.routes'));
  app.use('/api/v1/uploads', require('./routes/upload.routes'));
  app.use('/api/v1/jobs', require('./routes/job.routes'));
  app.use('/api/v1/quotes', require('./routes/quote.routes'));
  app.use('/api/v1/settings', require('./routes/settings.routes'));
  app.use('/api/v1/conversations', require('./routes/chat.routes'));
  app.use('/api/v1/notifications', require('./routes/notification.routes'));
  app.use('/api/v1/reports', require('./routes/report.routes'));
  app.use('/api/v1/bookings', require('./routes/booking.routes'));
  app.use('/api/v1/services', require('./routes/service.routes'));
  app.use('/api/v1/admin', require('./routes/admin.routes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
