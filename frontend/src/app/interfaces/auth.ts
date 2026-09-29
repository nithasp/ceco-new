export type UserRole = 'editor' | 'admin';

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
}

// The refresh token never appears here: it travels in an HttpOnly cookie the browser cannot read
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}
