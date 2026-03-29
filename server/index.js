const { startServer } = require('./tcp_server');

// Leemos argumentos de linea de comandos para extraer --port
const args = process.argv.slice(2);
let port = 3000; // default

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
        port = parseInt(args[i + 1], 10);
    }
}

// Arrancar motor principal TCP
startServer(port);
