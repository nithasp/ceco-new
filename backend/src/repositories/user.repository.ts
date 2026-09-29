import db from '../database';
import { Queryable, Row } from '../types/database.types';
import { Pagination } from '../types/pagination.types';
import { NewUserRow, ProfileUpdate, PublicUser, StoredUser, UserRole } from '../types/user.types';
import { requireRow } from '../utils/rows';

const SAFE_FIELDS = 'id, first_name, last_name, username, role';
const LIVE = 'deleted_at IS NULL';

export class UserRepository {
  async index(page: Pagination, runner: Queryable = db): Promise<PublicUser[]> {
    const { rows } = await runner.query(
      `SELECT ${SAFE_FIELDS} FROM users WHERE ${LIVE} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [page.limit, page.offset],
    );
    return rows.map(toPublicUser);
  }

  async count(runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(`SELECT COUNT(*) AS count FROM users WHERE ${LIVE}`);
    return Number(rows[0]?.count ?? 0);
  }

  async show(id: number, runner: Queryable = db): Promise<PublicUser | null> {
    const { rows } = await runner.query(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ? AND ${LIVE}`, [id]);
    return rows[0] ? toPublicUser(rows[0]) : null;
  }

  async findByUsername(username: string, runner: Queryable = db): Promise<PublicUser | null> {
    const { rows } = await runner.query(
      `SELECT ${SAFE_FIELDS} FROM users WHERE LOWER(username) = LOWER(?) AND ${LIVE}`,
      [username],
    );
    return rows[0] ? toPublicUser(rows[0]) : null;
  }

  // This and findCredentialsById are the only queries that read the password hash; neither returns
  // a closed account
  async findCredentials(username: string, runner: Queryable = db): Promise<StoredUser | null> {
    const { rows } = await runner.query(
      `SELECT ${SAFE_FIELDS}, password, password_version FROM users
       WHERE LOWER(username) = LOWER(?) AND ${LIVE}`,
      [username],
    );
    return rows[0] ? toStoredUser(rows[0]) : null;
  }

  async findCredentialsById(id: number, runner: Queryable = db): Promise<StoredUser | null> {
    const { rows } = await runner.query(
      `SELECT ${SAFE_FIELDS}, password, password_version FROM users WHERE id = ? AND ${LIVE}`,
      [id],
    );
    return rows[0] ? toStoredUser(rows[0]) : null;
  }

  async create(user: NewUserRow, runner: Queryable = db): Promise<PublicUser> {
    const { insertId } = await runner.query(
      `INSERT INTO users (first_name, last_name, username, password, password_version, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.firstName,
        user.lastName,
        user.username,
        user.passwordHash,
        user.passwordVersion,
        user.role ?? 'editor',
      ],
    );
    const created = await this.show(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO users');
  }

  async updateProfile(
    id: number,
    changes: ProfileUpdate,
    runner: Queryable = db,
  ): Promise<PublicUser | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.firstName !== undefined) {
      fields.push('first_name = ?');
      values.push(changes.firstName);
    }
    if (changes.lastName !== undefined) {
      fields.push('last_name = ?');
      values.push(changes.lastName);
    }
    if (changes.username !== undefined) {
      fields.push('username = ?');
      values.push(changes.username);
    }
    if (!fields.length) return this.show(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND ${LIVE}`,
      values,
    );
    return rowCount > 0 ? this.show(id, runner) : null;
  }

  async updatePassword(
    id: number,
    passwordHash: string,
    passwordVersion: number,
    runner: Queryable = db,
  ): Promise<boolean> {
    const { rowCount } = await runner.query(
      `UPDATE users SET password = ?, password_version = ? WHERE id = ? AND ${LIVE}`,
      [passwordHash, passwordVersion, id],
    );
    return rowCount > 0;
  }

  async updateRole(id: number, role: UserRole, runner: Queryable = db): Promise<PublicUser | null> {
    const { rowCount } = await runner.query(`UPDATE users SET role = ? WHERE id = ? AND ${LIVE}`, [role, id]);
    return rowCount > 0 ? this.show(id, runner) : null;
  }
}

function toPublicUser(row: Row): PublicUser {
  return {
    id: Number(row.id),
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    username: row.username as string,
    role: (row.role as UserRole | undefined) ?? 'editor',
  };
}

function toStoredUser(row: Row): StoredUser {
  return {
    ...toPublicUser(row),
    passwordHash: row.password as string,
    passwordVersion: Number(row.password_version),
  };
}
