const { buildResponse, buildJSONResponse, build404NotFound, build400BadRequest } = require('./http_response');
const fs = require('fs');
const path = require('path');

const routes = {
    'GET': {},
    'POST': {}
};

let globalApiKey = null;

/**
 * Registra un handler para un path y un http method dado.
 */
function registerRoute(method, path, handler) {
    if (!routes[method]) routes[method] = {};
    routes[method][path] = handler;
}

/**
 * Establece globalmente la API key del servidor desde el index.js
 */
function setApiKey(key) {
    globalApiKey = key;
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

    // Middleware global en crudo: Comprobar API Key si el servidor requiere autenticación
    if (globalApiKey) {
        if (req.headers['x-api-key'] !== globalApiKey) {
            console.log(`[Router] Bloqueando petición sin API Key válida.`);
            return buildJSONResponse(401, 'Unauthorized', { error: 'Acceso denegado. API Key inválida o inexistente en cabecera x-api-key.' });
        }
    }

    const match = matchRoute(method, path);
    if (match) {
        req.params = match.params;
        return match.handler(req);
    }

    // Si la ruta no existe, devolvemos un 404
    return build404NotFound('Ruta no encontrada en el servidor');
}

// ==========================================
// Registro de Rutas Iniciales "Hola Mundo"
// ==========================================

registerRoute('GET', '/', (req) => {
    return buildJSONResponse(200, 'OK', { message: "¡Hola Mundo desde el Servidor TCP crudo!" });
});

registerRoute('GET', '/status', (req) => {
    return buildResponse({
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/plain' },
        body: "Servidor operativo."
    });
});

registerRoute('GET', '/index.html', (req) => {
    try {
        const filePath = path.join(__dirname, '..', 'public', 'index.html');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return buildResponse({
            statusCode: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/html' },
            body: fileContents
        });
    } catch (error) {
        return build404NotFound('Archivo estático no encontrado');
    }
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
    return buildJSONResponse(200, 'OK', dogs);
});

registerRoute('GET', '/dogs/:id', (req) => {
    const id = parseInt(req.params.id, 10);
    const dog = dogs.find((item) => item.id === id);

    if (!dog) {
        return build404NotFound('Perro no encontrado');
    }

    return buildJSONResponse(200, 'OK', dog);
});

registerRoute('PUT', '/dogs/:id', (req) => {
    const id = parseInt(req.params.id, 10);
    const dogIndex = dogs.findIndex((item) => item.id === id);

    if (dogIndex === -1) {
        return build404NotFound('Perro no encontrado');
    }

    let updatedData;
    try {
        updatedData = JSON.parse(req.body);
    } catch (e) {
        return build400BadRequest('JSON malformado');
    }

    const existingDog = dogs[dogIndex];
    const updatedDog = Object.assign({}, existingDog, updatedData, { id: existingDog.id });
    dogs[dogIndex] = updatedDog;

    return buildJSONResponse(200, 'OK', updatedDog);
});

registerRoute('DELETE', '/dogs/:id', (req) => {
    const id = parseInt(req.params.id, 10);
    const dogIndex = dogs.findIndex((item) => item.id === id);

    if (dogIndex === -1) {
        return build404NotFound('Perro no encontrado');
    }

    dogs.splice(dogIndex, 1);

    return buildResponse({
        statusCode: 204,
        statusText: 'No Content',
        headers: {},
        body: ''
    });
});

registerRoute('POST', '/dogs', (req) => {
    let newDog;
    try {
        newDog = JSON.parse(req.body);
    } catch (e) {
        return build400BadRequest('El cuerpo de la petición debe ser un JSON válido');
    }

    // Le asignamos el próximo id disponible y lo guardamos
    newDog.id = nextDogId++;
    dogs.push(newDog);

    return buildJSONResponse(201, 'Created', newDog);
});

module.exports = { registerRoute, handleRequest, setApiKey };
