const http = require('http');
const { assertEnv } = require('./config/env');
const connectDB = require('./config/database');
const createApp = require('./app');
const initSocket = require('./socket');
const { autoConfirmDue } = require('./services/booking.service');

const AUTO_CONFIRM_EVERY_MS = 10 * 60 * 1000;

async function start() {
  assertEnv();
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  app.set('io', initSocket(server));

  const port = Number(process.env.PORT || 5000);
  server.listen(port, () => console.log(`Handzi API on http://localhost:${port}`));

  // Release payment for jobs the client hasn't confirmed or disputed within the window.
  setInterval(() => {
    autoConfirmDue()
      .then((n) => n && console.log(`[bookings] auto-confirmed ${n}`))
      .catch((e) => console.warn('[bookings] auto-confirm failed:', e.message));
  }, AUTO_CONFIRM_EVERY_MS).unref();
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
