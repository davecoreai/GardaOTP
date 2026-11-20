import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

import cancelOrderHandler from './api/cancel-order.js';
import catalogHandler from './api/catalog.js';
import createPaymentHandler from './api/create-payment.js';
import dashboardHandler from './api/dashboard.js';
import dokuWebhookHandler from './api/doku-webhook.js';
import historyHandler from './api/history.js';
import nokosWebhookHandler from './api/nokos-webhook.js';
import offersHandler from './api/offers.js';
import orderHandler from './api/order.js';
import orderStatusHandler from './api/order-status.js';
import publicConfigHandler from './api/public-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const wrap = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res)).catch(next);
};

// Webhook routes read raw body streams directly for HMAC verification
app.all('/api/doku-webhook', wrap(dokuWebhookHandler));
app.all('/api/nokos-webhook', wrap(nokosWebhookHandler));

// Standard JSON API routes
const jsonParser = express.json({ limit: '1mb' });
const jsonApiRoutes = {
  '/api/cancel-order': cancelOrderHandler,
  '/api/catalog': catalogHandler,
  '/api/create-payment': createPaymentHandler,
  '/api/dashboard': dashboardHandler,
  '/api/history': historyHandler,
  '/api/offers': offersHandler,
  '/api/order': orderHandler,
  '/api/order-status': orderStatusHandler,
  '/api/public-config': publicConfigHandler
};

for (const [route, handler] of Object.entries(jsonApiRoutes)) {
  app.all(route, jsonParser, wrap(handler));
}

// Explicit public static assets (avoid exposing server/api/sql files)
app.use('/asset', express.static(path.join(__dirname, 'asset')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/app.js', (_req, res) => res.sendFile(path.join(__dirname, 'app.js')));
app.get('/style.css', (_req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/manifest.webmanifest', (_req, res) => {
  res.type('application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.webmanifest'));
});
app.get('/lib/balance-format.js', (_req, res) => {
  res.sendFile(path.join(__dirname, 'lib', 'balance-format.js'));
});

// Redirects & SPA routes from vercel.json
app.get('/landingpage', (_req, res) => res.redirect(301, '/'));
app.get(['/', '/index.html', '/login', '/app'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, host, () => {
  console.log(`Garda OTP server listening on http://${host}:${port}`);
});
