/**
 * Construye el string de respuesta HTTP para enviarlo al socket TCP.
 * 
 * @param {number} statusCode - P.ej. 200, 404, 500
 * @param {string} statusText - P.ej. 'OK', 'Not Found', 'Internal Server Error'
 * @param {Object} headers - Objeto con cabeceras clave-valor
 * @param {string} body - Contenido opcional de la respuesta
 * @returns {string} String HTTP/1.1 formateado
 */
function buildResponse({ statusCode = 200, statusText = 'OK', headers = {}, body = '' }) {
    let responseText = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;

    // Si hay body, siempre es buena práctica mandar el Content-Length
    if (body.length > 0 && !headers['content-length'] && !headers['Content-Length']) {
        // En un caso real usaríamos Buffer.byteLength(body) si puede haber unicode
        headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
    }

    for (const [key, value] of Object.entries(headers)) {
        responseText += `${key}: ${value}\r\n`;
    }

    // Cabecera vacía indica el fin de los headers y el inicio del body
    responseText += '\r\n';
    
    if (body) {
        responseText += body;
    }

    return responseText;
}

module.exports = { buildResponse };
