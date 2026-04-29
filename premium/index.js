const { createTlsUpgrader } = require('./tls/tls_handler');
const { createLoginValidator } = require('./tls/login_validator');
const { loadTlsCredentials } = require('./tls/tls_config');
const { setupTlsStack } = require('./tls/setup');

module.exports = {
    setupTlsStack
};
