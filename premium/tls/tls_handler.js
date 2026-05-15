const tls = require('tls');

function ensureRawSocket(rawSocket) {
    if (!rawSocket || typeof rawSocket.on !== 'function' || typeof rawSocket.write !== 'function') {
        throw new TypeError('[TLS] upgrade(rawSocket) requires a valid TCP socket.');
    }
}

function createTlsUpgrader({ tlsOptions = {}, secureContext, handshakeTimeoutMs = 10000 } = {}) {
    const normalizedTlsOptions = {
        ...tlsOptions,
        isServer: true
    };

    if (secureContext) {
        normalizedTlsOptions.secureContext = secureContext;
    }

    function upgrade(rawSocket, onSecure) {
        ensureRawSocket(rawSocket);

        const secureSocket = new tls.TLSSocket(rawSocket, normalizedTlsOptions);
        secureSocket.setTimeout(handshakeTimeoutMs);

        secureSocket.once('secure', () => {
            secureSocket.setTimeout(0);
            if (typeof onSecure === 'function') {
                onSecure(secureSocket);
            }
        });

        return secureSocket;
    }

    return { upgrade };
}

module.exports = { createTlsUpgrader };