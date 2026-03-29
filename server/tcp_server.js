const net = require('net');
const { parseRequest } = require('./http_parser');
const { handleRequest } = require('./router');

/**
 * Inicia el motor TCP para escuchar peticiones HTTP
 * @param {number} port - Puerto de escucha
 */
function startServer(port) {
    const server = net.createServer((socket) => {
        // En una implementación madura, lidiaríamos con el "chunkeo" de TCP
        // Para establecer la estructura base, asumimos lectura directa
        let buffer = '';

        socket.on('data', (data) => {
            buffer += data.toString('utf8');

            // Detectar fin de headers
            if (buffer.includes('\r\n\r\n')) {
                try {
                    // 1. Convertir buffer o data bruta en Objeto Request
                    const reqObj = parseRequest(buffer);

                    // 2. Pasar el request al enrutador y obtener string crudo de la Response
                    const resString = handleRequest(reqObj);

                    // 3. Escribir Response al socket de vuelta y cortar
                    socket.write(resString);
                    socket.end(); // Terminamos la peticion tras contestar (No hay Keep-Alive)
                } catch (err) {
                    console.error("[TCP Exception] Error parseando request:", err);
                    socket.end('HTTP/1.1 400 Bad Request\r\n\r\nBad Request\n');
                }
            }
        });

        socket.on('error', (err) => {
            console.error('[Socket Error]:', err.message);
        });
    });

    server.listen(port, () => {
        console.log(`[+] Servidor TCP Base HTTP/1.1 escuchando en el puerto ${port}`);
        console.log(`[+] Puedes probar haciendo: curl -v http://localhost:${port}/`);
    });

    return server; // Retornamos la instancia por si se quiere cerrar o controlar desde fuera
}

module.exports = { startServer };
