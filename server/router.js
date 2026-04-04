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

// ==========================================
// Base de datos en memoria (CRUD Perros)
// ==========================================
let dogs = [
    { id: 1, name: "Hercules", breed: "Mastín", age: 3 },
    { id: 2, name: "Luna", breed: "Labrador", age: 1 }
];
let nextDogId = 3;

registerRoute('GET', '/dogs', (req) => {
    // Listar todos los recursos
    return buildResponse({
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dogs)
    });
});

registerRoute('POST', '/dogs', (req) => {
    let newDog;
    try {
        newDog = JSON.parse(req.body);
    } catch (e) {
        return buildResponse({
            statusCode: 400,
            statusText: 'Bad Request',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "El cuerpo de la petición debe ser un JSON válido" })
        });
    }

    // Le asignamos el próximo id disponible y lo guardamos
    newDog.id = nextDogId++;
    dogs.push(newDog);

    return buildResponse({
        statusCode: 201,
        statusText: 'Created',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDog)
    });
});

module.exports = { registerRoute, handleRequest };
