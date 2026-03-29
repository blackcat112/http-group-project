const { buildResponse } = require('./http_response');

const routes = {
    'GET': {},
    'POST': {}
};

/**
 * Registra un handler para un path y un http method dado.
 */
function registerRoute(method, path, handler) {
    if (!routes[method]) routes[method] = {};
    routes[method][path] = handler;
}

/**
 * Toma el objeto de request y devuelve el string final de response
 * usando el handler adecuado.
 */
function handleRequest(req) {
    const { method, path } = req;
    
    console.log(`[Router] Buscando handler para ${method} ${path}`);
    
    const handler = routes[method] && routes[method][path];
    
    if (handler) {
        return handler(req);
    }

    // Si la ruta no existe, devolvemos un 404
    return buildResponse({
        statusCode: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'text/plain' },
        body: '404 - Ruta no encontrada en el servidor.\n'
    });
}

// ==========================================
// Registro de Rutas Iniciales "Hola Mundo"
// ==========================================

registerRoute('GET', '/', (req) => {
    return buildResponse({
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "¡Hola Mundo desde el Servidor TCP crudo!" })
    });
});

registerRoute('GET', '/status', (req) => {
    return buildResponse({
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/plain' },
        body: "Servidor operativo."
    });
});

module.exports = { registerRoute, handleRequest };
