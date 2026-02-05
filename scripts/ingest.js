/**
 * Main Data Ingestion Orchestrator
 * Runs all ingestion scripts in sequence.
 *
 * Each script is independent and handles its own error recovery.
 * If one script fails, the others still run.
 *
 * Usage: node scripts/ingest.js
 *
 * Environment variables required:
 *   CLOUDFLARE_ACCOUNT_ID  - Cloudflare account ID
 *   D1_DATABASE_ID         - D1 database UUID
 *   CLOUDFLARE_D1_TOKEN    - API token with D1 write permissions
 *   GITHUB_TOKEN           - (optional) GitHub personal access token for higher API rate limits
 */

const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  { name: 'ingest-maxroll-builds.js', desc: 'Maxroll Tier List & Build Guides (AUTO-UPDATE)' },
  { name: 'ingest-tierlist.js', desc: 'Icy Veins Tier List' },
  { name: 'ingest-d4data.js', desc: 'DiabloTools/d4data Game Data' },
  { name: 'ingest-maxroll.js', desc: 'Maxroll Compiled Game Data' },
];

const scriptsDir = __dirname;
const results = [];

// Validate environment before starting
function checkEnv() {
  // When USE_WRANGLER=1, wrangler uses CLOUDFLARE_API_TOKEN for auth
  // Otherwise, we need the D1-specific token
  const useWrangler = process.env.USE_WRANGLER === '1';

  const required = useWrangler
    ? ['CLOUDFLARE_ACCOUNT_ID'] // Wrangler uses CLOUDFLARE_API_TOKEN automatically
    : ['CLOUDFLARE_ACCOUNT_ID', 'D1_DATABASE_ID', 'CLOUDFLARE_D1_TOKEN'];

  const missing = required.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('ERROR: Missing required environment variables:');
    for (const v of missing) {
      console.error(`  - ${v}`);
    }
    console.error('\nSet these variables before running ingestion.');
    process.exit(1);
  }

  console.log('Environment check passed.');
  if (useWrangler) {
    console.log('  Using wrangler CLI mode (CLOUDFLARE_API_TOKEN)');
  }
  if (process.env.GITHUB_TOKEN) {
    console.log('  GITHUB_TOKEN is set (authenticated GitHub API access)');
  } else {
    console.log('  GITHUB_TOKEN not set (unauthenticated GitHub API - 60 req/hr limit)');
  }
}

// Run all scripts
function main() {
  const startTime = Date.now();

  console.log('============================================');
  console.log('  D4 Guide Data Ingestion Pipeline');
  console.log(`  ${new Date().toISOString()}`);
  console.log('============================================\n');

  checkEnv();

  for (const script of scripts) {
    const scriptPath = path.join(scriptsDir, script.name);
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  Running: ${script.name}`);
    console.log(`  Source:  ${script.desc}`);
    console.log('='.repeat(50));

    const scriptStart = Date.now();

    try {
      execSync(`node "${scriptPath}"`, {
        stdio: 'inherit',
        cwd: path.resolve(scriptsDir, '..'),
        env: process.env,
        timeout: 300000, // 5 minute timeout per script
      });

      const elapsed = ((Date.now() - scriptStart) / 1000).toFixed(1);
      console.log(`\n  [OK] ${script.name} completed in ${elapsed}s`);
      results.push({ name: script.name, status: 'success', elapsed });
    } catch (err) {
      const elapsed = ((Date.now() - scriptStart) / 1000).toFixed(1);
      const exitCode = err.status || 'unknown';
      console.error(`\n  [FAIL] ${script.name} failed (exit code: ${exitCode}) after ${elapsed}s`);
      if (err.message && !err.message.includes('exited with')) {
        console.error(`  Error: ${err.message}`);
      }
      results.push({ name: script.name, status: 'failed', elapsed, exitCode });
      // Continue with other scripts
    }
  }

  // Summary
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const succeeded = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`\n${'='.repeat(50)}`);
  console.log('  Ingestion Summary');
  console.log('='.repeat(50));

  for (const r of results) {
    const icon = r.status === 'success' ? '[OK]  ' : '[FAIL]';
    console.log(`  ${icon} ${r.name} (${r.elapsed}s)`);
  }

  console.log(`\n  Total: ${succeeded} succeeded, ${failed} failed`);
  console.log(`  Elapsed: ${totalElapsed}s`);
  console.log('='.repeat(50));

  // Exit with error code if any script failed
  if (failed > 0) {
    process.exit(1);
  }
}

main();
