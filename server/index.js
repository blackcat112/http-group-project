const { startServer } = require('./tcp_server');
const { setApiKey, registerRoute } = require('./router');
const { registerMimeRoutes } = require('../premium/mime/mime_routes');
const { setupTlsStack } = require('../premium/tls/setup');

// ──────────────────────────────────────────────────────────────────────────────
// Command line args
//   --port <n>          (default: 3000)
//   --api-key <key>    Api key auth
//   --tls              activate https
//   --tls-key <path>   (default: premium/tls/certs/dev-key.pem)
//   --tls-cert <path>  (default: premium/tls/certs/dev-cert.pem) just keep default ones
// ──────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let port = 3000;
let apiKey = null;
let useTls = false;
let tlsKey = 'premium/tls/certs/dev-key.pem';
let tlsCert = 'premium/tls/certs/dev-cert.pem';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { port = parseInt(args[i + 1], 10); i++; }
    if (args[i] === '--api-key' && args[i + 1]) { apiKey = args[i + 1]; i++; }
    if (args[i] === '--tls') { useTls = true; }
    if (args[i] === '--tls-key' && args[i + 1]) { tlsKey = args[i + 1]; i++; }
    if (args[i] === '--tls-cert' && args[i + 1]) { tlsCert = args[i + 1]; i++; }
}

// ── API Key ────────────────────────────────────────────────────────────────────
if (apiKey) {
    setApiKey(apiKey);
    console.log(`[*] Secure mode activated. API key configured.`);
}

registerMimeRoutes(registerRoute);


let tlsStack = null;
if (useTls) {
    tlsStack = setupTlsStack({ keyPath: tlsKey, certPath: tlsCert });
    console.log(`[*] TLS activado. Certificado: ${tlsCert}`);
}

const tcpContext = startServer(port, tlsStack);


process.on('SIGINT', () => {
    console.log('\n[!] Señal SIGINT recibida (Ctrl+C). Preparando apagado...');

    for (const socket of tcpContext.activeSockets) {
        socket.destroy();
    }

    tcpContext.server.close(() => {
        console.log('[+] El sistema se ha apagado sin corrupciones.');
        process.exit(0);
    });
});
