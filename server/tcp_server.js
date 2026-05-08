const net = require('net');
const { parseRequest } = require('./http_parser');
const { handleRequest } = require('./router');

const activeSockets = new Set();

/**
 * Handles an HTTP-ready socket (plain TCP or post-handshake TLS).
 * @param {net.Socket|tls.TLSSocket} socket
 */
function handleSocket(socket) {
    // Concurrency limit guard
    if (activeSockets.size >= 1000) {
        console.warn('[!] Concurrency limit reached');
        socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\nServer full\n');
        socket.end();
        return;
    }

    activeSockets.add(socket);
    console.log(`[+] New client connected. Total clients: ${activeSockets.size}`);

    // Destroy idle sockets after 10 s
    socket.setTimeout(10000);
    socket.on('timeout', () => {
        console.log(`[!] Timeout alcanzado. Destruyendo socket zombi...`);
        socket.destroy();
    });

    // Buffer to accumulate TCP chunks (supports binary / image bodies)
    let buffer = Buffer.alloc(0);

    socket.on('data', async (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        // Pipelining loop
        while (true) {
            const headerEnd = buffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) break;

            const headerString = buffer.subarray(0, headerEnd).toString('utf8');
            let contentLength = 0;
            const clMatch = headerString.match(/content-length:\s*(\d+)/i);
            if (clMatch) {
                contentLength = parseInt(clMatch[1], 10);
            }

            const requestSize = headerEnd + 4 + contentLength;

            // Wait until the full request (headers + body) is buffered
            if (buffer.length < requestSize) {
                console.log(`[~] Fragmento TCP recibido. Faltan datos del Body... Esperando...`);
                break;
            }

            const fullRequestBuffer = buffer.subarray(0, requestSize);
            buffer = buffer.subarray(requestSize);

            try {
                const reqObj = parseRequest(fullRequestBuffer.toString('utf8'));
                const resString = await handleRequest(reqObj);

                socket.write(resString);
            } catch (err) {
                console.error("[TCP Exception] Error parseando request:", err);
                socket.write('HTTP/1.1 400 Bad Request\r\n\r\nBad Request\n');
                socket.end();
                break;
            }
        }
    });

    socket.on('error', (err) => {
        if (err.code === 'ECONNRESET') {
            console.log(`[!] Omitiendo error de red: El cliente cerró la conexión HTTP de forma violenta.`);
        } else {
            console.error('[TCP Error Crítico]:', err.message);
        }
    });


    const cleanUp = () => {
        if (activeSockets.has(socket)) {
            activeSockets.delete(socket);
            console.log(`[-] Cliente desconectado. Total activos: ${activeSockets.size}`);
        }
    };

    socket.on('end', cleanUp);
    socket.on('close', cleanUp);
}

/**
 * Starts the TCP server. Pass a tlsStack (from setupTlsStack) to enable HTTPS.
 * @param {number} port
 * @param {object|null} tlsStack
 */
function startServer(port, tlsStack = null) {
    const protocol = tlsStack ? 'HTTPS (TLS)' : 'HTTP';

    const server = net.createServer((rawSocket) => {
        if (tlsStack) {
            tlsStack.upgrade(rawSocket, (secureSocket) => {
                console.log('[TLS] Handshake completado. Socket seguro listo.');
                handleSocket(secureSocket);
            });
            rawSocket.on('error', (err) => {
                console.error('[TLS] Handshake error:', err.message);
            });
        } else {
            handleSocket(rawSocket);
        }
    });

    server.listen(port, () => {
        console.log(`[+] Servidor ${protocol} escuchando en el puerto ${port}`);
        if (tlsStack) {
            console.log(`[+] Conecta con: https://localhost:${port}/`);
            console.log(`[+] Prueba con curl: curl -k https://localhost:${port}/`);
        }
    });

    return { server, activeSockets };
}

module.exports = { startServer };
