const fs = require('fs');
const path = require('path');

// Archivo donde se volcará toda la actividad del servidor
const logFilePath = path.join(__dirname, '..', 'server.log');
// Abrimos un stream en modo append para no sobreescribir lo de ayer
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Guardamos referencias a las funciones originales del core de Node
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

/**
 * Aplica formato corporativo añadiendo fechas y niveles
 */
function formatMessage(level, args) {
    const timestamp = new Date().toISOString();
    
    // Convertir los argumentos variables a una cadena de texto plana
    const message = Array.from(args).map(arg => {
        if (arg instanceof Error) return arg.stack || arg.message;
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
    }).join(' ');
    
    return `[${timestamp}] [${level}] ${message}\n`;
}

// Inyección de interceptores (Monkey-Patching)
console.log = function(...args) {
    originalLog.apply(console, args);
    logStream.write(formatMessage('INFO', args));
};

console.warn = function(...args) {
    originalWarn.apply(console, args);
    logStream.write(formatMessage('WARN', args));
};

console.error = function(...args) {
    originalError.apply(console, args);
    logStream.write(formatMessage('ERROR', args));
};

module.exports = { logFilePath };
