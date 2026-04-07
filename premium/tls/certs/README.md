# Development TLS credentials

Generate local certificates that can be consumed by the premium wrapper.

```bash
mkdir -p premium/tls/certs
openssl req -x509 -newkey rsa:2048 -sha256 -nodes \
	-keyout premium/tls/certs/dev-key.pem \
	-out premium/tls/certs/dev-cert.pem \
	-days 365 \
	-subj "/CN=localhost"
```

Then load them from your server/client integration using:

- `loadTlsCredentials({ keyPath, certPath })`
- `createTlsUpgrader({ tlsOptions })`