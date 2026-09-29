import { config } from '../config';
import { closeDatabase } from '../database';
import { UserRepository } from '../repositories/user.repository';
import { userService } from '../services';

const MIN_PASSWORD_LENGTH = 12;

// The site's single editor account. Running this again on an existing username promotes it rather
// than creating a second one, so there is never more than one way in.
async function main(): Promise<void> {
  const { username, password, firstName, lastName } = config.adminSeed;

  if (!username?.trim() || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set (in .env or the environment).');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const name = username.trim();
  const users = new UserRepository();
  const existing = await users.findByUsername(name);

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`[seed:admin] "${name}" (id ${existing.id}) is already an admin. Nothing to do.`);
      return;
    }
    await users.updateRole(existing.id, 'admin');
    console.log(`[seed:admin] Promoted existing user "${name}" (id ${existing.id}) to admin.`);
    return;
  }

  const created = await userService.createUser({
    username: name,
    password,
    firstName: firstName?.trim() || 'CECO',
    lastName: lastName?.trim() || 'Admin',
    role: 'admin',
  });
  console.log(`[seed:admin] Created admin "${name}" (id ${created.id}).`);
}

main()
  .catch((err: Error) => {
    console.error(`[seed:admin] ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
