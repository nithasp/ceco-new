// The site has one editor account and no public sign-up, so 'admin' is the only role that grants
// anything; 'editor' exists so a future account can be added without a migration
export const USER_ROLES = ['editor', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface PublicUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
}

// Never sent to a client: it carries the password hash
export interface StoredUser extends PublicUser {
  passwordHash: string;
  passwordVersion: number;
}

export interface NewUser {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role?: UserRole | undefined;
}

export interface NewUserRow extends Omit<NewUser, 'password'> {
  passwordHash: string;
  passwordVersion: number;
}

export interface ProfileUpdate {
  firstName?: string | undefined;
  lastName?: string | undefined;
  username?: string | undefined;
}
