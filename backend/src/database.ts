import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from './config';
import { logger } from './logger';
import { QueryOutcome, Queryable, Row, Tx } from './types/database.types';

const { url, host, port, name, user, password, poolLimit, sslMode, sslCa } = config.database;

// 'no-verify' accepts any certificate the server offers, which a provider with a self-signed
// certificate needs; it does not protect against a machine in the middle (OWASP API8)
const ssl =
  sslMode === 'off'
    ? undefined
    : sslMode === 'no-verify'
      ? { rejectUnauthorized: false }
      : { rejectUnauthorized: true, ...(sslCa ? { ca: sslCa } : {}) };

// utf8mb4 is what keeps the Thai copy intact; timezone 'Z' makes the driver read and write every
// DATETIME as UTC, so a row means the same thing wherever the server runs
const shared = {
  waitForConnections: true,
  connectionLimit: poolLimit,
  charset: 'utf8mb4',
  timezone: 'Z',
  supportBigNumbers: true,
  bigNumberStrings: false,
  enableKeepAlive: true,
  ...(ssl ? { ssl } : {}),
};

// config refuses to start without either DATABASE_URL or both MYSQL_USER and MYSQL_PASSWORD, so
// reaching the second branch means these two are set
const pool: Pool = url
  ? mysql.createPool({ uri: url, ...shared })
  : mysql.createPool({
      host,
      port,
      database: name,
      ...(user ? { user } : {}),
      ...(password ? { password } : {}),
      ...shared,
    });

// The driver writes and reads every DATETIME as UTC (timezone: 'Z' above). A server session left
// on its own local time would convert those values again on the way in, shifting every timestamp,
// so each new connection is pinned to UTC as well. Promise.resolve covers both driver APIs, and a
// failure is logged rather than left as an unhandled rejection.
pool.on('connection', (connection) => {
  Promise.resolve(connection.query("SET time_zone = '+00:00'")).catch((err: unknown) =>
    logger.error({ err }, 'could not pin the session time zone to UTC'),
  );
});

// Values go through the driver's escaping rather than being pasted into the string, so a quote in
// Thai copy or a title cannot change the statement (OWASP API8). query() is used over execute()
// because it expands an array into an IN list, which the filters below rely on.
function adapt(runner: Pool | PoolConnection): Queryable {
  return {
    async query<R extends Row = Row>(text: string, values: unknown[] = []): Promise<QueryOutcome<R>> {
      const [result] = await runner.query<RowDataPacket[] | ResultSetHeader>(text, values);

      if (Array.isArray(result)) {
        return { rows: result as unknown as R[], rowCount: result.length, insertId: 0 };
      }
      return { rows: [], rowCount: result.affectedRows, insertId: result.insertId };
    },
  };
}

export const db: Queryable = adapt(pool);

export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(adapt(connection));
    await connection.commit();
    return result;
  } catch (err) {
    await connection
      .rollback()
      .catch((rollbackErr: unknown) => logger.error({ err: rollbackErr }, 'rollback failed'));
    throw err;
  } finally {
    connection.release();
  }
}

export async function checkDatabase(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (err) {
    logger.error({ err }, 'database health check failed');
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}

export default db;
