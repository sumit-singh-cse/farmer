const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');

let sock = null;
let isConnected = false;

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('\n======================================================');
        console.log('🌾 SCAN THE QR CODE BELOW ON WHATSAPP TO ENROLL ALERTS:');
        console.log('======================================================\n');
        QRCode.generate(qr, { small: true });
        console.log('\n======================================================\n');
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('[WhatsApp Info] Connection closed. Reconnecting...', shouldReconnect);
        isConnected = false;
        if (shouldReconnect) {
          connectToWhatsApp();
        }
      } else if (connection === 'open') {
        console.log('🟢 [WhatsApp Info] Connected successfully! Automatic notifications are now live.');
        isConnected = true;
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error('❌ [WhatsApp Error] Failed to connect WhatsApp client:', err.message);
  }
}

async function sendWhatsAppAlert(mobile, message) {
  // Format 10 digit Indian mobile numbers with +91 country prefix
  let formattedMobile = mobile.replace(/[^0-9]/g, '');
  if (formattedMobile.length === 10) {
    formattedMobile = '91' + formattedMobile;
  }
  const jid = `${formattedMobile}@s.whatsapp.net`;

  if (isConnected && sock) {
    try {
      await sock.sendMessage(jid, { text: message });
      console.log(`📡 [WhatsApp Alert Sent] Target: ${jid} | Message: "${message}"`);
      return true;
    } catch (err) {
      console.error(`❌ [WhatsApp Alert Failure] Target: ${jid} | Error:`, err.message);
    }
  }

  // Graceful simulation log in case WhatsApp is not logged in / scanned
  console.log(`📝 [WhatsApp Simulation Output] Target: ${jid} | Message: "${message}"`);
  return false;
}

// Start connection process ONLY if not in production without session
// On Render/Heroku, WhatsApp will be disabled unless pre-configured session exists
if (process.env.NODE_ENV !== 'production' || require('fs').existsSync(path.join(__dirname, 'auth_info_baileys'))) {
  connectToWhatsApp().catch(err => console.error('WhatsApp initialization error:', err.message));
} else {
  console.log('⚠️ [WhatsApp] Disabled in production mode without existing session. Use SMS notifications instead.');
}

module.exports = {
  sendWhatsAppAlert
};
