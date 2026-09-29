import supertest from 'supertest';

// supertest.agent keeps cookies between requests, which is what the refresh-cookie tests need.
// Taken from the function itself so the type follows whatever version is installed.
export type TestAgent = ReturnType<typeof supertest.agent>;

export interface TestClient {
  get(url: string): supertest.Test;
  post(url: string, body?: unknown): supertest.Test;
  patch(url: string, body?: unknown): supertest.Test;
  put(url: string, body?: unknown): supertest.Test;
  delete(url: string, body?: unknown): supertest.Test;
}

export interface TestUser extends TestClient {
  id: number;
  username: string;
  password: string;
  agent: TestAgent;
  token: string;
}
