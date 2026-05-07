const { startServer } = require('./tcp_server');

const { setApiKey, registerRoute } = require('./router');
const { registerMimeRoutes } = require('../premium/mime/mime_routes');


// Leemos argumentos de linea de comandos para extraer --port y --api-key
const args = process.argv.slice(2);
let port = 3000; // default
let apiKey = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
        port = parseInt(args[i + 1], 10);
    } else if (args[i] === '--api-key' && args[i + 1]) {
        apiKey = args[i + 1];
    }
}

// Inyectamos la API key elegida en el enrutador antes de levantar internet
if (apiKey) {
    setApiKey(apiKey);
    console.log(`[*] Modo Seguro activado. API Key configurada: ${apiKey}`);
}

registerMimeRoutes(registerRoute);

// Arrancar motor principal TCP y guardar contexto para el apagado
const tcpContext = startServer(port);

// Escuchar evento del sistema operativo para cuando el profesor use Ctrl+C
process.on('SIGINT', () => {
    console.log('\n[!] Señal SIGINT recibida (Ctrl+C). Preparando apagado...');
    
    // Cerrar todas las conexiones activas primero
    for (const socket of tcpContext.activeSockets) {
        socket.destroy();
    }
    
    // Apagar el motor principal de forma controlada
    tcpContext.server.close(() => {
        console.log('[+] El sistema se ha apagado sin corrupciones.');
        process.exit(0);
    });
});
