const net = require("net");
const { parseRequest } = require("./http_parser");
const { handleRequest } = require("./router");

const activeSockets = new Set();

/**
 * Handles an HTTP-ready socket (plain TCP or post-handshake TLS).
 * @param {net.Socket|tls.TLSSocket} socket
 */
function handleSocket(socket) {
  // Concurrency limit guard
  if (activeSockets.size >= 1000) {
    console.warn("[!] Concurrency limit reached");
    socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\nServer full\n");
    socket.end();
    return;
  }

  activeSockets.add(socket);
  console.log(`[+] New client connected. Total clients: ${activeSockets.size}`);

  // Destroy idle sockets after 10 s
  socket.setTimeout(10000);
  socket.on("timeout", () => {
    console.log(`[!] Timeout reached. Destroying idle socket...`);
    socket.destroy();
  });

  // Buffer to accumulate TCP chunks (supports binary / image bodies)
  let buffer = Buffer.alloc(0);

  socket.on("data", async (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    // Pipelining loop
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;

      const headerString = buffer.subarray(0, headerEnd).toString("utf8");

      let requestSize = headerEnd + 4; // Tamaño base (cabeceras + \r\n\r\n)

      const clMatch = headerString.match(/content-length:\s*(\d+)/i);
      const isChunked = /transfer-encoding:\s*chunked/i.test(headerString);

      if (clMatch) {
        requestSize += parseInt(clMatch[1], 10);
      } else if (isChunked) {
        // Buscamos el terminador de chunked: "0\r\n\r\n"
        const chunkedEnd = buffer.indexOf("0\r\n\r\n", headerEnd + 4);
        if (chunkedEnd === -1) {
          console.log(`[~] Esperando el final del chunked body...`);
          break;
        }
        requestSize = chunkedEnd + 5; // Incluye los 5 bytes de "0\r\n\r\n"
      }

      // Wait until the full request (headers + body) is buffered
      if (buffer.length < requestSize) {
        console.log(
          `[~] Incomplete request buffered. Waiting for more data...`,
        );
        break;
      }

      const fullRequestBuffer = buffer.subarray(0, requestSize);
      buffer = buffer.subarray(requestSize);

      try {
        // IMPORTANTE: Pasamos 'binary' en lugar de 'utf8' para no destruir imágenes
        const reqObj = parseRequest(fullRequestBuffer.toString("binary"));
        const resString = await handleRequest(reqObj);

        socket.write(resString);
      } catch (err) {
        console.error("[TCP Exception] Failed to parse request:", err);
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\nBad Request\n");
        socket.end();
        break;
      }
    }
  });

  socket.on("error", (err) => {
    if (err.code === "ECONNRESET") {
      console.log(
        `[!] Ignoring network error: client closed the connection abruptly.`,
      );
    } else {
      console.error("[TCP Critical Error]:", err.message);
    }
  });

  const cleanUp = () => {
    if (activeSockets.has(socket)) {
      activeSockets.delete(socket);
      console.log(
        `[-] Client disconnected. Total clients: ${activeSockets.size}`,
      );
    }
  };

  socket.on("end", cleanUp);
  socket.on("close", cleanUp);
}

/**
 * Starts the TCP server. Pass a tlsStack (from setupTlsStack) to enable HTTPS.
 * @param {number} port
 * @param {object|null} tlsStack
 */
function startServer(port, tlsStack = null) {
  const protocol = tlsStack ? "HTTPS (TLS)" : "HTTP";

  const server = net.createServer((rawSocket) => {
    if (tlsStack) {
      tlsStack.upgrade(rawSocket, (secureSocket) => {
        console.log("[TLS] Handshake complete. Secure socket ready.");
        handleSocket(secureSocket);
      });
      rawSocket.on("error", (err) => {
        console.error("[TLS] Handshake error:", err.message);
      });
    } else {
      handleSocket(rawSocket);
    }
  });

  server.listen(port, () => {
    console.log(`[+] ${protocol} server listening on port ${port}`);
    if (tlsStack) {
      console.log(`[+] Connect at: https://localhost:${port}/`);
      console.log(`[+] Test with: curl -k https://localhost:${port}/`);
    }
  });

  return { server, activeSockets };
}

module.exports = { startServer };
