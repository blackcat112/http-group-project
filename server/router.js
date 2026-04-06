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
 * Toma el objeto de request y hace el match con la ruta correspondiente recorriendo las rutas registradas para el método correspondiente, devuelve el response
 * usando el handler adecuado, más el parametro extraído de la ruta, si es que lo hay.
 */
function matchRoute(method, path) {
    if (!routes[method]) return null;

    // Match exacto
    if (routes[method][path]) {
        return { handler: routes[method][path], params: {} };
    }

    // Match dinámico: compara segmentos y extrae parámetros, para ver si la ruta coincide con algo.
    const requestSegments = path.split('/').filter(Boolean);

    for (const routePath of Object.keys(routes[method])) {
        const routeSegments = routePath.split('/').filter(Boolean);
        if (routeSegments.length !== requestSegments.length) continue;

        const params = {};
        let matched = true;

        for (let i = 0; i < routeSegments.length; i++) {
            const routeSegment = routeSegments[i];
            const requestSegment = requestSegments[i];

            if (routeSegment.startsWith(':')) {
                // Captura el valor: /parametro/:id
                const paramName = routeSegment.slice(1);
                params[paramName] = requestSegment;
            } else if (routeSegment !== requestSegment) {
                matched = false;
                break;
            }
        }

        if (matched) {
            return { handler: routes[method][routePath], params };
        }
    }

    return null;
}

/**
 * Función principal que maneja la lógica de routing: recibe el request, busca el handler adecuado y devuelve el response. 
 * Si no encuentra ruta, devuelve un 404.
 * @param {*} req 
 * @returns 
 */
function handleRequest(req) {
    const { method, path } = req;

    console.log(`[Router] Buscando handler para ${method} ${path}`);

    const match = matchRoute(method, path);
    if (match) {
        req.params = match.params;
        return match.handler(req);
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

registerRoute('GET', '/dogs/:id', (req) => {
    const id = parseInt(req.params.id, 10);
    const dog = dogs.find((item) => item.id === id);

    if (!dog) {
        return buildResponse({
            statusCode: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Perro no encontrado' })
        });
    }

    return buildResponse({
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dog)
    });
});

registerRoute('DELETE', '/dogs/:id', (req) => {
    const id = parseInt(req.params.id, 10);
    const dogIndex = dogs.findIndex((item) => item.id === id);

    if (dogIndex === -1) {
        return buildResponse({
            statusCode: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Perro no encontrado' })
        });
    }

    dogs.splice(dogIndex, 1);

    return buildResponse({
        statusCode: 204,
        statusText: 'No Content',
        headers: { 'Content-Type': 'application/json' },
        body: ''
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
