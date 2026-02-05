/**
 * D1 Client
 * Shared module for executing SQL against Cloudflare D1.
 *
 * Supports two modes:
 *   1. Wrangler CLI (local) - Uses OAuth credentials, no env vars needed
 *   2. REST API (CI) - Requires CLOUDFLARE_D1_TOKEN env var
 *
 * Environment variables (for REST API mode):
 *   CLOUDFLARE_ACCOUNT_ID  - Cloudflare account ID
 *   D1_DATABASE_ID         - D1 database UUID
 *   CLOUDFLARE_D1_TOKEN    - API token with D1 write permissions
 */

const { execSync } = require('child_process');
const path = require('path');

const ACCOUNT_ID = () => process.env.CLOUDFLARE_ACCOUNT_ID;
const DB_ID = () => process.env.D1_DATABASE_ID;
const TOKEN = () => process.env.CLOUDFLARE_D1_TOKEN;
const DB_NAME = 'd4-api';

// Detect whether to use wrangler CLI or REST API
function useWranglerCLI() {
  // Use CLI if no API token is set (local dev) or if USE_WRANGLER is set
  return !TOKEN() || process.env.USE_WRANGLER === '1';
}

function validateEnv() {
  if (useWranglerCLI()) {
    return; // Wrangler uses OAuth, no env vars needed
  }
  const missing = [];
  if (!ACCOUNT_ID()) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!DB_ID()) missing.push('D1_DATABASE_ID');
  if (!TOKEN()) missing.push('CLOUDFLARE_D1_TOKEN');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Execute SQL via wrangler CLI
 */
function d1ExecuteWrangler(sql, params = []) {
  // Substitute ? placeholders with actual values for wrangler
  let paramIndex = 0;
  const substitutedSql = sql.replace(/\?/g, () => {
    const val = params[paramIndex++];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    // Escape single quotes by doubling them
    return `'${String(val).replace(/'/g, "''")}'`;
  });

  const projectDir = path.resolve(__dirname, '..');

  // Build environment for wrangler
  // In CI (USE_WRANGLER=1), we use CLOUDFLARE_API_TOKEN for auth
  // Locally, we clear the API token to force OAuth
  const envOverride = process.env.USE_WRANGLER === '1'
    ? { ...process.env } // Keep API token in CI
    : { ...process.env, CLOUDFLARE_API_TOKEN: undefined }; // Clear for local OAuth

  try {
    // Find wrangler binary - use npx in CI for reliability
    let cmd;
    if (process.platform === 'win32') {
      const wranglerPath = path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
      cmd = `node "${wranglerPath}" d1 execute ${DB_NAME} --remote --json --command "${substitutedSql.replace(/"/g, '\\"')}"`;
    } else {
      // On Linux/CI, use npx or global wrangler
      cmd = `npx wrangler d1 execute ${DB_NAME} --remote --json --command "${substitutedSql.replace(/"/g, '\\"')}"`;
    }

    const output = execSync(cmd, {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: envOverride,
      timeout: 60000,
    });

    // Parse JSON output from wrangler
    const lines = output.split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {}
    }

    return [{ results: [], success: true }];
  } catch (err) {
    throw new Error(`Wrangler D1 execute failed: ${err.message}`);
  }
}

/**
 * Execute a single SQL statement against D1.
 * @param {string} sql - SQL statement with ? placeholders
 * @param {Array} params - Bind parameters
 * @returns {Promise<Array>} D1 result array
 */
async function d1Execute(sql, params = []) {
  validateEnv();

  if (useWranglerCLI()) {
    return d1ExecuteWrangler(sql, params);
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID()}/d1/database/${DB_ID()}/query`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`D1 API HTTP ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  if (!data.success) {
    throw new Error(`D1 API error: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

/**
 * Execute multiple SQL statements sequentially.
 * Each statement is executed in its own API call to stay within D1 limits.
 * @param {Array<{sql: string, params: Array}>} statements
 * @returns {Promise<Array>} Array of D1 results
 */
async function d1Batch(statements) {
  validateEnv();

  const results = [];
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      const result = await d1Execute(stmt.sql, stmt.params || []);
      results.push(result);
    } catch (err) {
      console.error(`  Batch statement ${i + 1}/${statements.length} failed: ${err.message}`);
      throw err;
    }
  }
  return results;
}

/**
 * Execute multiple statements in chunks for large inserts.
 * Logs progress every `logEvery` statements.
 * @param {Array<{sql: string, params: Array}>} statements
 * @param {number} logEvery - Log progress interval (default 25)
 * @returns {Promise<number>} Count of successfully executed statements
 */
async function d1BatchWithProgress(statements, logEvery = 25) {
  validateEnv();

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    try {
      await d1Execute(statements[i].sql, statements[i].params || []);
      success++;
    } catch (err) {
      failed++;
      console.error(`  Statement ${i + 1} failed: ${err.message}`);
    }

    if ((i + 1) % logEvery === 0) {
      console.log(`  Progress: ${i + 1}/${statements.length} (${success} ok, ${failed} failed)`);
    }
  }

  console.log(`  Final: ${success}/${statements.length} succeeded, ${failed} failed`);
  return success;
}

module.exports = { d1Execute, d1Batch, d1BatchWithProgress };
