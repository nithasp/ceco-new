import supertest from 'supertest';
import app from '../../app';
import { UserRepository } from '../../repositories/user.repository';
import { CURRENT_PASSWORD_VERSION, hashPassword } from '../../services/password.service';
import { Locale } from '../../types/common.types';
import { TestAgent, TestClient, TestUser } from '../../types/test.types';

export const API = '/api/v1';

export const api = supertest(app);

const users = new UserRepository();

export const uniqueName = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

function clientFor(agent: TestAgent, token: () => string): TestClient {
  const withAuth = (test: supertest.Test) => test.set('Authorization', `Bearer ${token()}`);
  return {
    get: (url) => withAuth(agent.get(`${API}${url}`)),
    post: (url, body) => withAuth(agent.post(`${API}${url}`)).send(body ?? {}),
    patch: (url, body) => withAuth(agent.patch(`${API}${url}`)).send(body ?? {}),
    put: (url, body) => withAuth(agent.put(`${API}${url}`)).send(body ?? {}),
    delete: (url, body) => withAuth(agent.delete(`${API}${url}`)).send(body ?? {}),
  };
}

function testUser(id: number, username: string, password: string, token: string, agent: TestAgent): TestUser {
  let accessToken = token;
  const client = clientFor(agent, () => accessToken);
  return {
    id,
    username,
    password,
    agent,
    get token() {
      return accessToken;
    },
    set token(value: string) {
      accessToken = value;
    },
    ...client,
  };
}

// There is no register route, so an account is created through the repository and then signed in
// the same way a real editor would be
async function createUser(prefix: string, role: 'admin' | 'editor'): Promise<TestUser> {
  const username = uniqueName(prefix);
  const password = 'testpassword123';
  const created = await users.create({
    firstName: 'Test',
    lastName: role === 'admin' ? 'Admin' : 'Editor',
    username,
    role,
    passwordHash: await hashPassword(password),
    passwordVersion: CURRENT_PASSWORD_VERSION,
  });

  const agent = supertest.agent(app);
  const res = await agent.post(`${API}/auth/login`).send({ username, password }).expect(200);
  return testUser(created.id, username, password, res.body.data.accessToken, agent);
}

export const createAdmin = (prefix = 'admin'): Promise<TestUser> => createUser(prefix, 'admin');

export const createEditor = (prefix = 'editor'): Promise<TestUser> => createUser(prefix, 'editor');

// Each spec makes its own carousel, so tests do not fight over the one row a locale allows
export async function ensureHeader(admin: TestUser, locale: Locale): Promise<number> {
  const existing = await admin.get('/admin/headers').expect(200);
  const found = (existing.body.data as { id: number; locale: string }[]).find(
    (header) => header.locale === locale,
  );
  if (found) return found.id;

  const created = await admin.post('/admin/headers', { name: `Header ${locale}`, locale }).expect(201);
  return created.body.data.id as number;
}

export function cookiesOf(res: supertest.Response): string[] {
  const header = res.headers['set-cookie'];
  return Array.isArray(header) ? header : header ? [String(header)] : [];
}

export function refreshCookie(res: supertest.Response): string | undefined {
  return cookiesOf(res).find((cookie) => cookie.startsWith('refreshToken='));
}

export function cookieValue(cookie: string): string {
  return cookie.split(';')[0]?.split('=')[1] ?? '';
}

// A 1x1 GIF: small enough to upload in a test, and a type the allow list accepts
export const TINY_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
