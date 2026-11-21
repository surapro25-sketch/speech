import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAILS = 'allowed_admin@example.com,surapro@system.internal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Backup original users.json for safety
let originalUsersContent = '[]';
if (fs.existsSync(USERS_FILE)) {
  originalUsersContent = fs.readFileSync(USERS_FILE, 'utf-8');
}

// Reset users file with known initial state
const initialTestUsers = [
  {
    id: 'usr-admin-1',
    username: 'existing_admin',
    email: 'allowed_admin@example.com',
    name: 'Existing Admin',
    password: 'admin_password123',
    role: 'admin',
    status: 'active',
    authProvider: 'local',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-bad-data-google-admin',
    username: 'bad_google_admin',
    email: 'unauthorized_google@example.com',
    name: 'Unauthorized Google Admin',
    password: 'password123',
    role: 'admin', // This bad data should be corrected to 'user' by migration!
    status: 'active',
    authProvider: 'google',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-normal-user',
    username: 'regular_user',
    email: 'regular_user@example.com',
    name: 'Regular User',
    password: 'user_password123',
    role: 'user',
    status: 'active',
    authProvider: 'local',
    createdAt: new Date().toISOString(),
  }
];

fs.writeFileSync(USERS_FILE, JSON.stringify(initialTestUsers, null, 2), 'utf-8');

// Now import server and migration
const { app, initUserStorage, getUsers } = await import('../server.ts');
const { runMigration } = await import('../scripts/migrate-roles.ts');

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING AUTH & GOOGLE OAUTH SECURITY TEST SUITE');
  console.log('====================================================');

  // Start HTTP server on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // -------------------------------------------------------------
    // TEST 1: New Google sign-in creates a user with default role 'user'
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Verifying new Google sign-in creates user with default role ("user")...');
    const newGoogleEmail = `new_student_${Date.now()}@gmail.com`;
    const signupRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newGoogleEmail,
        name: 'New Google Student',
        username: `student_${Date.now().toString().slice(-4)}`,
        password: 'secure_password_123',
        role: 'admin', // Malicious attempt to self-assign admin
      }),
    });

    const signupData = await signupRes.json();
    assert.strictEqual(signupRes.status, 200, 'Signup response should be 200 OK');
    assert.strictEqual(signupData.success, true, 'Signup should succeed');
    assert.strictEqual(
      signupData.user.role,
      'user',
      'SECURITY CRITICAL: New Google user MUST have default role "user", NEVER "admin"'
    );
    assert.strictEqual(signupData.user.authProvider, 'google', 'Provider should be google');
    console.log('  PASSED: New Google account created with default role "user" (malicious role request ignored).');

    const newGoogleUserToken = signupData.token;

    // -------------------------------------------------------------
    // TEST 2: Google user cannot access admin routes
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Verifying Google user cannot access admin routes...');
    const adminRoutes = [
      { method: 'GET', path: '/api/admin/users' },
      { method: 'POST', path: '/api/admin/users', body: { username: 'hacker', email: 'h@h.com', password: 'pass' } },
      { method: 'POST', path: `/api/admin/users/${signupData.user.id}/ban` },
      { method: 'DELETE', path: `/api/admin/users/${signupData.user.id}` },
      { method: 'POST', path: `/api/admin/users/${signupData.user.id}/role`, body: { role: 'admin' } },
    ];

    for (const route of adminRoutes) {
      const res = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        headers: {
          Authorization: `Bearer ${newGoogleUserToken}`,
          'Content-Type': 'application/json',
        },
        body: route.body ? JSON.stringify(route.body) : undefined,
      });

      assert.strictEqual(
        res.status,
        403,
        `Expected 403 Forbidden for Google user accessing ${route.method} ${route.path}, got ${res.status}`
      );
      const data = await res.json();
      assert.ok(data.error.includes('Administrator privileges required'), 'Should return permission denied message');
    }
    console.log('  PASSED: All admin API routes strictly reject standard Google users with 403 Forbidden.');

    // -------------------------------------------------------------
    // TEST 3: Existing admin stays admin upon sign-in
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Verifying existing admin stays admin...');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'existing_admin',
        password: 'admin_password123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert.strictEqual(adminLoginRes.status, 200);
    assert.strictEqual(adminLoginData.success, true);
    assert.strictEqual(adminLoginData.user.role, 'admin', 'Existing admin must keep admin role');

    const adminToken = adminLoginData.token;

    // Verify admin can access admin routes
    const adminUsersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminUsersRes.status, 200, 'Admin should be able to access /api/admin/users');
    const adminUsersData = await adminUsersRes.json();
    assert.ok(Array.isArray(adminUsersData.users), 'Admin users list returned');
    console.log('  PASSED: Existing admin remains admin and can access admin routes.');

    // -------------------------------------------------------------
    // TEST 4: Normal user cannot promote themselves or anyone else
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Verifying normal user cannot promote themselves...');
    // Attempt 1: Via admin endpoint
    const promoteAttemptRes = await fetch(`${baseUrl}/api/admin/users/${signupData.user.id}/role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${newGoogleUserToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert.strictEqual(promoteAttemptRes.status, 403, 'Normal user must be forbidden from role promotion endpoint');

    // Attempt 2: Via repeating Google login with role: 'admin'
    const googleReLoginRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newGoogleEmail,
        name: 'New Google Student',
        role: 'admin',
      }),
    });
    const googleReLoginData = await googleReLoginRes.json();
    assert.strictEqual(googleReLoginRes.status, 200);
    assert.strictEqual(googleReLoginData.user.role, 'user', 'Normal user role must remain "user"');

    // Verify admin can promote user
    const adminPromoteRes = await fetch(`${baseUrl}/api/admin/users/${signupData.user.id}/role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert.strictEqual(adminPromoteRes.status, 200, 'Admin can promote user');
    const adminPromoteData = await adminPromoteRes.json();
    assert.strictEqual(adminPromoteData.user.role, 'admin');

    // Admin demotes user back
    const adminDemoteRes = await fetch(`${baseUrl}/api/admin/users/${signupData.user.id}/role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'user' }),
    });
    assert.strictEqual(adminDemoteRes.status, 200, 'Admin can demote user');
    console.log('  PASSED: Normal users cannot promote themselves; only authorized admins can grant roles.');

    // -------------------------------------------------------------
    // TEST 5: Allowlist ADMIN_EMAILS grants admin to allowlisted email
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Verifying server-side ADMIN_EMAILS allowlist functionality...');
    const allowlistedEmail = 'allowed_admin@example.com';
    const allowlistSignupRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: allowlistedEmail,
        name: 'Allowlisted Admin',
      }),
    });
    const allowlistData = await allowlistSignupRes.json();
    assert.strictEqual(allowlistData.user.role, 'admin', 'Email in ADMIN_EMAILS should receive admin role');
    console.log('  PASSED: Email in ADMIN_EMAILS allowlist received admin access.');

    // -------------------------------------------------------------
    // TEST 6: Bad data migration - demote unauthorized Google admin
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Verifying bad data cleanup migration...');
    // Inject a bad Google user with admin role directly into DB
    const currentUsers = getUsers();
    currentUsers.push({
      id: 'usr-bad-data-test-6',
      username: 'rogue_admin_user',
      email: 'rogue_google@example.com',
      name: 'Rogue Google User',
      role: 'admin', // Should be demoted
      status: 'active',
      authProvider: 'google',
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(USERS_FILE, JSON.stringify(currentUsers, null, 2), 'utf-8');

    const migrationResult = runMigration();
    assert.ok(migrationResult.demoted >= 1, 'Migration should find and demote unauthorized Google admin');

    const updatedUsers = getUsers();
    const badUser = updatedUsers.find((u) => u.id === 'usr-bad-data-test-6');
    assert.ok(badUser, 'Bad user record exists');
    assert.strictEqual(badUser.role, 'user', 'Unauthorized Google admin must be migrated to role "user"');
    console.log('  PASSED: Bad database records with unauthorized Google admin role were safely corrected to "user".');

    console.log('\n====================================================');
    console.log('ALL AUTHENTICATION & SECURITY TESTS PASSED (6/6)');
    console.log('====================================================\n');
  } finally {
    server.close();
    // Restore original users content
    if (originalUsersContent) {
      fs.writeFileSync(USERS_FILE, originalUsersContent, 'utf-8');
      // Run migration on restored content
      initUserStorage();
    }
  }
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
