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

    // Añadimos la cabecera obligatoria Date si no está presente
    if (!headers['Date'] && !headers['date']) {
        headers['Date'] = new Date().toUTCString();
    }

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

function buildJSONResponse(statusCode, statusText, data) {
    return buildResponse({
        statusCode,
        statusText,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

function build404NotFound(message = 'Recurso no encontrado') {
    return buildJSONResponse(404, 'Not Found', { error: message });
}

function build400BadRequest(message = 'Petición malformada') {
    return buildJSONResponse(400, 'Bad Request', { error: message });
}

function build405MethodNotAllowed(message = 'Método no permitido') {
    return buildJSONResponse(405, 'Method Not Allowed', { error: message });
}

function build500InternalServerError(message = 'Error interno del servidor') {
    return buildJSONResponse(500, 'Internal Server Error', { error: message });
}

module.exports = { 
    buildResponse, 
    buildJSONResponse,
    build404NotFound,
    build400BadRequest,
    build405MethodNotAllowed,
    build500InternalServerError
};
