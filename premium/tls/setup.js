const { createTlsUpgrader } = require('./tls_handler');
const { createLoginValidator } = require('./login_validator');
const { loadTlsCredentials } = require('./tls_config');

function setupTlsStack({
    keyPath,
    certPath,
    caPath,
    users = {},
    customValidator,
    handshakeTimeoutMs = 10000
} = {}) {
    const credentials = loadTlsCredentials({
        keyPath,
        certPath,
        caPath,
        minVersion: 'TLSv1.2'
    });

    const tlsUpgrader = createTlsUpgrader({
        tlsOptions: credentials.tlsOptions,
        handshakeTimeoutMs
    });

    const loginValidator = createLoginValidator({
        users,
        customValidator
    });

    return {
        credentials,
        upgrade: tlsUpgrader.upgrade,
        validateLogin: loginValidator.validateLogin
    };
}

module.exports = { setupTlsStack };
