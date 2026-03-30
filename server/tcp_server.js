const net = require('net');
const { parseRequest } = require('./http_parser');
const { handleRequest } = require('./router');

// Estructura global para registrar clientes conectados
const activeSockets = new Set();

/**
 * Inicia el motor TCP para escuchar peticiones HTTP
 * @param {number} port - Puerto de escucha
 */
function startServer(port) {
    const server = net.createServer((socket) => {
        // Defensas contra saturación de usuarios
        if (activeSockets.size >= 1000) {
            console.warn('[!] Límite de concurrencia sobrepasado (1000). Repeliendo usuario.');
            socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\nServidor Lleno\n');
            socket.end();
            return;
        }

        // Registro de clientes en memoria
        activeSockets.add(socket);
        console.log(`[+] Nuevo cliente conectado. Total activos: ${activeSockets.size}`);

        // Recolector de basura: destruir conexión si el cliente no habla en 10 segundos
        socket.setTimeout(10000);
        socket.on('timeout', () => {
            console.log(`[!] Timeout alcanzado. Destruyendo socket zombi...`);
            socket.destroy();
        });

        // Acumulación de chunks TCP
        // Usamos un Buffer auténtico de Node por si luego hay que parsear archivos binarios o imágenes.
        let buffer = Buffer.alloc(0);

        socket.on('data', (chunk) => {
            // Concatenamos el nuevo trozo (fragmento TCP) que nos acaba de entrar al que ya teníamos
            buffer = Buffer.concat([buffer, chunk]);

            // Bucle para procesar peticiones encoladas (Pipelining)
            while (true) {
                const headerEnd = buffer.indexOf('\r\n\r\n');
                if (headerEnd === -1) break; // Esperamos salir del while y leer más chunks

                // Extraemos la cabecera en modo String para poder buscar cómodamente
                const headerString = buffer.subarray(0, headerEnd).toString('utf8');
                let contentLength = 0;
                
                // Expresión regular para buscar "Content-Length: X" sin importar si hay mayúsculas
                const clMatch = headerString.match(/content-length:\s*(\d+)/i);
                if (clMatch) {
                    contentLength = parseInt(clMatch[1], 10);
                }

                const requestSize = headerEnd + 4 + contentLength;
                
                // ¿Tenemos la petición completa en el buffer? (Headers + \r\n\r\n + el Body prometido)
                if (buffer.length < requestSize) {
                    console.log(`[~] Fragmento TCP recibido. Faltan datos del Body... Esperando...`);
                    break;
                }

                // ¡TENEMOS LA PETICIÓN COMPLETA!
                const fullRequestBuffer = buffer.subarray(0, requestSize);
                
                // Le pasamos la tijera al buffer: quitamos la petición actual para seguir escuchando
                buffer = buffer.subarray(requestSize);

                try {
                    const reqObj = parseRequest(fullRequestBuffer.toString('utf8'));
                    const resString = handleRequest(reqObj);
                    
                    socket.write(resString);
                    // Mantenemos el socket abierto por defecto para soportar HTTP/1.1 (Keep-Alive)
                } catch (err) {
                    console.error("[TCP Exception] Error parseando request:", err);
                    socket.write('HTTP/1.1 400 Bad Request\r\n\r\nBad Request\n');
                    socket.end(); // Rompemos comunicación si intentan hackear el parseador
                    break;
                }
            }
        });

        socket.on('error', (err) => {
            console.error('[Socket Error]:', err.message);
        });

        // Destructor del cliente al perder conexión
        const cleanUp = () => {
            if (activeSockets.has(socket)) {
                activeSockets.delete(socket);
                console.log(`[-] Cliente desconectado. Total activos: ${activeSockets.size}`);
            }
        };

        socket.on('end', cleanUp);
        socket.on('close', cleanUp);
    });

    server.listen(port, () => {
        console.log(`[+] Servidor TCP (Ahora con Buffering) escuchando en el puerto ${port}`);
        console.log(`[+] Puedes probar mandando envíos grandes.`);
    });

    return { server, activeSockets };
}

module.exports = { startServer };
