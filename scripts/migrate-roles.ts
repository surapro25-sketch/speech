import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface UserRecord {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  authProvider: 'local' | 'google';
  createdAt: string;
}

export function runMigration(): { total: number; demoted: number; verified: number } {
  console.log('--- STARTING ROLE SANITIZATION MIGRATION ---');
  if (!fs.existsSync(USERS_FILE)) {
    console.log(`Users file not found at ${USERS_FILE}. Nothing to migrate.`);
    return { total: 0, demoted: 0, verified: 0 };
  }

  const raw = fs.readFileSync(USERS_FILE, 'utf-8');
  const users: UserRecord[] = JSON.parse(raw);

  const rawAdminEmails = process.env.ADMIN_EMAILS || 'surapro@system.internal,1surapro25@gmail.com';
  const allowlist = new Set(
    rawAdminEmails
      .split(/[,\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
  );

  console.log(`Allowed Admin Emails: ${Array.from(allowlist).join(', ')}`);

  let demoted = 0;
  let verified = 0;

  for (const user of users) {
    const userEmail = (user.email || '').toLowerCase().trim();
    const isAllowlisted = allowlist.has(userEmail);

    if (user.role === 'admin') {
      if (!isAllowlisted && user.username.toLowerCase() !== 'surapro') {
        console.log(`[DEMOTION] User '${user.username}' (${user.email}, provider: ${user.authProvider}) had unauthorized admin role. Changing to 'user'.`);
        user.role = 'user';
        demoted++;
      } else {
        console.log(`[VERIFIED ADMIN] User '${user.username}' (${user.email}) is legitimate allowlisted admin.`);
        verified++;
      }
    } else {
      if (isAllowlisted && user.status !== 'banned') {
        console.log(`[UPGRADE] User '${user.username}' (${user.email}) is in ADMIN_EMAILS. Promoting to 'admin'.`);
        user.role = 'admin';
        verified++;
      }
    }
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  console.log(`--- MIGRATION COMPLETE: ${users.length} total users, ${demoted} demoted, ${verified} verified/upgraded admins ---`);
  return { total: users.length, demoted, verified };
}

if (process.argv[1] && process.argv[1].endsWith('migrate-roles.ts')) {
  runMigration();
}
