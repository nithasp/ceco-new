// Migrations run before the app, with the widest privileges, so they resolve TLS on the same rule
// as src/config.ts instead of accepting any certificate the server offers (OWASP API8)
const sslMode = process.env.DATABASE_SSL || (process.env.DATABASE_URL ? 'verify' : 'off');
const sslCa = process.env.DATABASE_SSL_CA;

function ssl() {
  switch (sslMode) {
    case 'off':
      return false;
    case 'no-verify':
      return { rejectUnauthorized: false };
    case 'verify':
      return { rejectUnauthorized: true, ...(sslCa ? { ca: sslCa } : {}) };
    default:
      throw new Error(`[database] DATABASE_SSL must be off, no-verify or verify (got "${sslMode}")`);
  }
}

// db-migrate's mysql driver takes the flag as a string, so an "off" mode drops the key entirely
const tls = ssl() ? { ssl: ssl() } : {};

module.exports = {
  dev: {
    driver: 'mysql',
    host: { ENV: 'MYSQL_HOST' },
    port: { ENV: 'MYSQL_PORT' },
    database: { ENV: 'MYSQL_DB' },
    user: { ENV: 'MYSQL_USER' },
    password: { ENV: 'MYSQL_PASSWORD' },
    multipleStatements: true,
    ...tls,
  },
  production: {
    driver: 'mysql',
    url: { ENV: 'DATABASE_URL' },
    multipleStatements: true,
    ...tls,
  },
  test: {
    driver: 'mysql',
    host: { ENV: 'MYSQL_HOST' },
    port: { ENV: 'MYSQL_PORT' },
    database: { ENV: 'MYSQL_TEST_DB' },
    user: { ENV: 'MYSQL_USER' },
    password: { ENV: 'MYSQL_PASSWORD' },
    multipleStatements: true,
    ...tls,
  },
};
