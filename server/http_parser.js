/**
 * Parsea el string en crudo HTTP en un objeto usable.
 * Este parser asume que al menos los headers están completos (\r\n\r\n).
 * 
 * @param {string} rawData - Datos HTTP recibidos del socket.
 * @returns {Object} { method, path, version, headers, body }
 */
function parseRequest(rawData) {
    const splitIndex = rawData.indexOf('\r\n\r\n');
    let rawHeaders = rawData;
    let body = '';

    if (splitIndex !== -1) {
        rawHeaders = rawData.substring(0, splitIndex);
        body = rawData.substring(splitIndex + 4);
    }

    const lines = rawHeaders.split('\r\n');
    const [method, path, version] = lines[0].split(' ');
    
    const headers = {};
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const separatorIdx = line.indexOf(':');
        if (separatorIdx !== -1) {
            const key = line.substring(0, separatorIdx).trim().toLowerCase();
            const value = line.substring(separatorIdx + 1).trim();
            headers[key] = value;
        }
    }

    return {
        method: method || 'GET',
        path: path || '/',
        version: version || 'HTTP/1.1',
        headers,
        body
    };
}

module.exports = { parseRequest };
