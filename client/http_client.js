'use strict';

// HTTP/1.1 client library using raw TCP sockets 

/**
 * Sends an HTTP/1.1 request over a raw TCP socket.
 * @param {Object} options
 * @param {string} options.method     HTTP verb (GET, POST, PUT, DELETE, HEAD)
 * @param {string} options.url        Full URL (e.g. http://localhost:3000/cats)
 * @param {Object} options.headers    Additional headers as key-value object
 * @param {string|null} options.body  Request body (JSON string or null)
 * @returns {Promise<{statusCode, statusText, headers, body}>}
 */
function request({ method, url, headers = {}, body = null }) {
  return Promise.reject(new Error('Not implemented yet'));
}

module.exports = { request };