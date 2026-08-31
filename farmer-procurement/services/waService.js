'use strict';

/**
 * WhatsApp service (unofficial) using @whiskeysockets/baileys.
 *
 * - Auth/session credentials persist in MongoDB (NOT the filesystem) via
 *   mongo-baileys `useMongoDBAuthState`, so Render restarts/redeploys do NOT
 *   require re-scanning the QR.
 * - Reuses the EXISTING Mongoose Atlas connection, but a SEPARATE collection
 *   (default: `baileys_auth_state`) — farmer/booking data is untouched.
 * - Auto-reconnects on any disconnect EXCEPT explicit logout.
 * - Exposes sendWhatsAppMessage(phoneNumber, message) for any text message.
 *
 * All secrets/config come from environment variables (.env).
 *
 * Env vars:
 *   MONGODB_URI          (already used by the app — reused, not re-opened)
 *   WA_ENABLED           'false' to disable the whole module (default: enabled)
 *   WA_AUTH_COLLECTION   collection name for auth docs (default baileys_auth_state)
 *   WA_DEFAULT_COUNTRY   country code prepended to 10-digit numbers (default 91)
 *   WA_LOG_LEVEL         pino log level (default 'silent')
 */

const mongoose = require('mongoose');
const pino = require('pino');
const { useMongoDBAuthState } = require('mongo-baileys');
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

// QR rendering in terminal is optional — degrade gracefully if not installed.
let qrcode = null;
try { qrcode = require('qrcode-terminal'); } catch (_) { /* optional */ }

const WA_ENABLED = String(process.env.WA_ENABLED || 'true').toLowerCase() !== 'false';
const AUTH_COLLECTION = process.env.WA_AUTH_COLLECTION || 'baileys_auth_state';
const DEFAULT_COUNTRY = String(process.env.WA_DEFAULT_COUNTRY || '91');

const logger = pino({ level: process.env.WA_LOG_LEVEL || 'silent' });

let sock = null;
let isConnected = false;
let starting = false;
let reconnectAttempts = 0;

// Native MongoDB collection from the SAME Mongoose connection (no 2nd connection).
function getAuthCollection() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Mongoose is not connected yet');
  }
  return mongoose.connection.db.collection(AUTH_COLLECTION);
}

function backoffDelay() {
  // exponential backoff capped at 30s
  return Math.min(30000, 2000 * Math.pow(2, reconnectAttempts++));
}

/**
 * Initialise (or re-initialise) the WhatsApp socket.
 * Safe to call once at startup; it self-schedules reconnects afterwards.
 */
async function connectWhatsApp() {
  if (!WA_ENABLED) {
    console.log('[WA] Disabled (WA_ENABLED=false) — skipping WhatsApp init.');
    return null;
  }
  if (starting || isConnected) return sock;
  starting = true;

  try {
    const collection = getAuthCollection();
    const { state, saveCreds } = await useMongoDBAuthState(collection);

    // Use a known-good protocol version when reachable; fall back silently.
    let version;
    try { ({ version } = await fetchLatestBaileysVersion()); } catch (_) { version = undefined; }

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false, // we render the QR ourselves below
      markOnlineOnConnect: false,
      browser: ['FarmerProcurement', 'Chrome', '1.0.0']
    });

    // Persist credentials to Mongo whenever they change.
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n[WA] Scan this QR in WhatsApp > Linked Devices:\n');
        if (qrcode) qrcode.generate(qr, { small: true });
        else console.log(qr, '\n(install qrcode-terminal for a scannable image)');
      }

      if (connection === 'open') {
        isConnected = true;
        starting = false;
        reconnectAttempts = 0;
        console.log('[WA] Connected to WhatsApp successfully.');
      } else if (connection === 'close') {
        isConnected = false;
        starting = false;
        const code = lastDisconnect && lastDisconnect.error
          && lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.log('[WA] Logged out (401). Clear the auth collection and restart to re-scan QR.');
        } else {
          const delay = backoffDelay();
          console.log(`[WA] Connection closed (code=${code}). Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            connectWhatsApp().catch((e) => console.error('[WA] Reconnect failed:', e.message));
          }, delay);
        }
      }
    });

    return sock;
  } catch (err) {
    starting = false;
    console.error('[WA] Init error:', err.message);
    // Likely Mongoose not ready yet — retry with backoff.
    const delay = backoffDelay();
    setTimeout(() => {
      connectWhatsApp().catch(() => {});
    }, delay);
    return null;
  }
}

// Normalise a phone number to a WhatsApp JID.
function toJid(phoneNumber) {
  let digits = String(phoneNumber || '').replace(/\D/g, '');
  if (!digits) throw new Error('Invalid phone number');
  if (digits.length === 10) digits = DEFAULT_COUNTRY + digits; // assume local 10-digit
  return digits + '@s.whatsapp.net';
}

/**
 * Send a plain text WhatsApp message.
 * @param {string|number} phoneNumber e.g. '9876543210' or '919876543210'
 * @param {string} message           the text body
 * @returns {Promise<object>} Baileys send result
 */
async function sendWhatsAppMessage(phoneNumber, message) {
  if (!WA_ENABLED) {
    console.log('[WA] Disabled — message not sent.');
    return { skipped: true };
  }
  if (!sock || !isConnected) {
    throw new Error('WhatsApp is not connected yet (QR not scanned or connection down).');
  }
  const jid = toJid(phoneNumber);
  return sock.sendMessage(jid, { text: String(message) });
}

// Lightweight status probe (handy for a health endpoint).
function getWAStatus() {
  return { enabled: WA_ENABLED, connected: isConnected };
}

module.exports = { connectWhatsApp, sendWhatsAppMessage, getWAStatus };
