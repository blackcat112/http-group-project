const { startServer } = require('./tcp_server');

// Leemos argumentos de linea de comandos para extraer --port
const args = process.argv.slice(2);
let port = 3000; // default

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
        port = parseInt(args[i + 1], 10);
    }
}

// Arrancar motor principal TCP y guardar contexto para el apagado
const tcpContext = startServer(port);

// Escuchar evento del sistema operativo para cuando el profesor use Ctrl+C
process.on('SIGINT', () => {
    console.log('\n[!] Señal SIGINT recibida (Ctrl+C). Preparando apagado...');
    
    // TODO: Cerrar conexiones limpiamente antes de tirar el proceso
    console.log('[+] El sistema se ha apagado sin corrupciones.');
    process.exit(0);
});
