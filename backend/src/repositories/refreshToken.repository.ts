import crypto from 'crypto';
import db from '../database';
import { Queryable, Row } from '../types/database.types';
import { StoredRefreshToken } from '../types/refreshToken.types';

// Only a SHA-256 hash of each token is stored, so a database leak doesn't hand out live sessions
const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export class RefreshTokenRepository {
  async create(
    userId: number,
    expiresInMs: number,
    familyId: string = crypto.randomUUID(),
    runner: Queryable = db,
  ): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    await runner.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at) VALUES (?, ?, ?, ?)',
      [userId, hashToken(token), familyId, new Date(Date.now() + expiresInMs)],
    );
    return token;
  }

  // The UPDATE is the guard: when two requests race with the same token only one of them changes a
  // row, and only that one goes on to read it back
  async consume(token: string, runner: Queryable = db): Promise<StoredRefreshToken | null> {
    const hash = hashToken(token);
    const { rowCount } = await runner.query(
      `UPDATE refresh_tokens SET used_at = NOW()
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
      [hash],
    );
    if (rowCount === 0) return null;

    const { rows } = await runner.query('SELECT * FROM refresh_tokens WHERE token_hash = ?', [hash]);
    return rows[0] ? toRefreshToken(rows[0]) : null;
  }

  async findUsed(token: string, runner: Queryable = db): Promise<StoredRefreshToken | null> {
    const { rows } = await runner.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND used_at IS NOT NULL',
      [hashToken(token)],
    );
    return rows[0] ? toRefreshToken(rows[0]) : null;
  }

  async deleteFamily(familyId: string, runner: Queryable = db): Promise<void> {
    await runner.query('DELETE FROM refresh_tokens WHERE family_id = ?', [familyId]);
  }

  async deleteFamilyOf(token: string, runner: Queryable = db): Promise<number | null> {
    const { rows } = await runner.query(
      'SELECT user_id, family_id FROM refresh_tokens WHERE token_hash = ?',
      [hashToken(token)],
    );
    const found = rows[0];
    if (!found) return null;

    await runner.query('DELETE FROM refresh_tokens WHERE family_id = ?', [found.family_id]);
    return Number(found.user_id);
  }

  async deleteAllForUser(userId: number, runner: Queryable = db): Promise<void> {
    await runner.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  }

  // Used tokens are kept until they expire so a replay can still be recognised; this clears them out
  async deleteExpired(runner: Queryable = db): Promise<void> {
    await runner.query('DELETE FROM refresh_tokens WHERE expires_at <= NOW()');
  }
}

function toRefreshToken(row: Row): StoredRefreshToken {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    familyId: row.family_id as string,
    expiresAt: row.expires_at as Date,
    usedAt: (row.used_at as Date | null) ?? null,
    createdAt: row.created_at as Date,
  };
}
