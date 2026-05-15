/**
 * Parses a raw HTTP string into a usable request object.
 * Assumes at least the headers are complete (\r\n\r\n).
 *
 * @param {string} rawData - Raw HTTP data received from the socket.
 * @returns {Object} { method, path, version, headers, body }
 */
function parseRequest(rawData) {
  const splitIndex = rawData.indexOf("\r\n\r\n");
  let rawHeaders = rawData;
  let body = "";

  if (splitIndex !== -1) {
    rawHeaders = rawData.substring(0, splitIndex);
    body = rawData.substring(splitIndex + 4);
  }

  const lines = rawHeaders.split("\r\n");
  const [method, rawPath = "/", version = "HTTP/1.1"] = lines[0].split(" ");

  let path = rawPath;
  let query = {};

  const queryIndex = rawPath.indexOf("?");
  if (queryIndex !== -1) {
    path = rawPath.substring(0, queryIndex);
    const queryString = rawPath.substring(queryIndex + 1);

    queryString.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) {
        query[decodeURIComponent(k)] = decodeURIComponent(v || "");
      }
    });
  }

  try {
    path = decodeURI(path);
  } catch (e) {
    // Ignore malformed URI sequences
  }

  const headers = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const separatorIdx = line.indexOf(":");
    if (separatorIdx !== -1) {
      const key = line.substring(0, separatorIdx).trim().toLowerCase();
      const value = line.substring(separatorIdx + 1).trim();
      headers[key] = value;
    }
  }

  let cookies = {};
  if (headers["cookie"]) {
    headers["cookie"].split(";").forEach((cookieStr) => {
      const parts = cookieStr.split("=");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const val = parts.slice(1).join("=").trim();
        cookies[name] = decodeURIComponent(val);
      }
    });
  }

  let parsedBody = body;
  let bodyError = null;

  // --- NUEVO: Decodificador de peticiones Chunked ---
  if (headers["transfer-encoding"] === "chunked") {
    let decodedBody = "";
    let i = 0;
    while (i < body.length) {
      const crlfPos = body.indexOf("\r\n", i);
      if (crlfPos === -1) break;
      const sizeLine = body.substring(i, crlfPos).trim();
      const chunkSize = parseInt(sizeLine, 16);
      if (isNaN(chunkSize) || chunkSize === 0) break;
      const chunkStart = crlfPos + 2;
      decodedBody += body.substring(chunkStart, chunkStart + chunkSize);
      i = chunkStart + chunkSize + 2;
    }
    body = decodedBody.trim();
    parsedBody = body;
  }

  if (body && headers["content-type"]) {
    const contentType = headers["content-type"];
    if (contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        // EL CHIVATO: Ahora nos dirá exactamente qué intentó leer si falla
        bodyError =
          "JSON malformado. El servidor intentó leer esto: ->" + body + "<-";
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      parsedBody = {};
      body.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key) {
          parsedBody[decodeURIComponent(key)] = decodeURIComponent(value || "");
        }
      });
    }
  }

  return {
    method: method || "GET",
    path: path || "/",
    query,
    cookies,
    version: version || "HTTP/1.1",
    headers,
    body: parsedBody,
    rawBody: body,
    bodyError,
  };
}

module.exports = { parseRequest };
