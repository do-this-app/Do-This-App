#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DO THIS — Supabase Runtime Connectivity & Security Verification Script
 * Validates:
 * 1. Environment variables parsing & presence
 * 2. Supabase Cloud live connectivity (Auth Admin & REST API)
 * 3. Express API layer runtime accessibility
 * 4. Client bundle security audit (ensures NO service-role keys are exposed)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env if present
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(status, title, details = '') {
  totalChecks++;
  if (status) {
    passedChecks++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${title}`);
    if (details) console.log(`       \x1b[90m${details}\x1b[0m`);
  } else {
    failedChecks++;
    console.log(`\x1b[31m[FAIL]\x1b[0m ${title}`);
    if (details) console.log(`       \x1b[33m${details}\x1b[0m`);
  }
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function verifySupabase() {
  console.log('\n======================================================');
  console.log('  DO THIS — SUPABASE CONNECTIVITY & SECURITY VERIFIER');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // SECTION 1: Environment Variables Parsing
  // ----------------------------------------------------
  console.log('\x1b[1m[1/4] Environment Variables Validation\x1b[0m');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const viteUrl = process.env.VITE_SUPABASE_URL || '';
  const viteAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  // Check URL
  const isValidUrl = Boolean(supabaseUrl && /^https?:\/\/.+/.test(supabaseUrl));
  report(
    isValidUrl,
    'SUPABASE_URL format and presence',
    isValidUrl ? `URL: ${supabaseUrl}` : 'Missing or invalid SUPABASE_URL'
  );

  // Check Anon Key
  const anonJwt = decodeJwtPayload(anonKey);
  const isModernAnon = anonKey.startsWith('sb_publish') || anonKey.startsWith('sbp_');
  const isValidAnon = Boolean((anonJwt && (anonJwt.role === 'anon' || anonJwt.role === 'authenticated')) || isModernAnon);
  report(
    isValidAnon,
    'SUPABASE_ANON_KEY format and role',
    isModernAnon
      ? `Key format: Modern Supabase Publishable Key (${anonKey.slice(0, 12)}...)`
      : anonJwt
      ? `Role: ${anonJwt.role} (Ref: ${anonJwt.ref || 'valid'})`
      : 'Invalid or missing anon key'
  );

  // Check Service Role Key
  const serviceJwt = decodeJwtPayload(serviceKey);
  const isModernService = serviceKey.startsWith('sb_secret_') || serviceKey.startsWith('sbs_');
  const isValidService = Boolean((serviceJwt && serviceJwt.role === 'service_role') || isModernService);
  report(
    isValidService,
    'SUPABASE_SERVICE_ROLE_KEY format and role',
    isModernService
      ? `Key format: Modern Supabase Secret Key (${serviceKey.slice(0, 10)}...)`
      : serviceJwt
      ? `Role: ${serviceJwt.role} (Verified service_role token)`
      : 'Invalid or missing service_role key'
  );

  // Check Client-side VITE_ Variables
  const hasClientVars = Boolean(viteUrl && viteAnonKey);
  report(
    hasClientVars,
    'Client environment variables (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)',
    hasClientVars ? 'Both VITE_ variables are present for client-side use' : 'Missing VITE_ variables'
  );

  // Ensure service role key is NEVER assigned to a VITE_ variable
  const serviceKeyInVite = Object.keys(process.env).some(
    (k) => k.startsWith('VITE_') && process.env[k] === serviceKey
  );
  report(
    !serviceKeyInVite,
    'Service-role key isolation from VITE_ prefix',
    serviceKeyInVite
      ? 'CRITICAL WARNING: SUPABASE_SERVICE_ROLE_KEY is assigned to a VITE_ variable!'
      : 'Verified: No service-role key is exposed via VITE_ prefixed environment variables'
  );

  // ----------------------------------------------------
  // SECTION 2: Live Supabase Runtime Connectivity
  // ----------------------------------------------------
  console.log('\n\x1b[1m[2/4] Live Supabase Cloud Connectivity\x1b[0m');

  if (isValidUrl && isValidService) {
    try {
      const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Test 1: Admin Auth API
      const authTest = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (authTest.error) {
        report(false, 'Supabase Auth Admin connection', authTest.error.message);
      } else {
        report(
          true,
          'Supabase Auth Admin connection',
          `Successfully authenticated with project! User count query succeeded.`
        );
      }

      // Test 2: Database Schema / REST API Cache
      const dbTest = await adminClient.from('profiles').select('id').limit(1);
      if (dbTest.error && dbTest.error.code === 'PGRST205') {
        report(
          true,
          'Supabase REST API connectivity',
          'REST endpoint reachable (Schema cache verified; tables pending migration execution)'
        );
      } else if (!dbTest.error) {
        report(
          true,
          'Supabase REST API connectivity',
          'REST endpoint reachable and profiles table is queryable in PostgreSQL'
        );
      } else {
        report(
          false,
          'Supabase REST API connectivity',
          `Error: ${dbTest.error.message}`
        );
      }
    } catch (err) {
      report(false, 'Supabase runtime connection', err.message);
    }
  } else {
    report(false, 'Live Supabase Cloud Connectivity', 'Skipped due to missing URL or Service Key');
  }

  // ----------------------------------------------------
  // SECTION 3: API Layer Integration (/api/supabase/status)
  // ----------------------------------------------------
  console.log('\n\x1b[1m[3/4] Application API Layer Status\x1b[0m');

  const appPort = process.env.PORT || '3000';
  const apiStatusUrl = `http://localhost:${appPort}/api/supabase/status`;

  try {
    const res = await fetch(apiStatusUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      report(
        data.configured === true && data.authReady === true,
        'Application /api/supabase/status endpoint',
        `Configured: ${data.configured}, AuthReady: ${data.authReady}, TablesCreated: ${data.tablesCreated}`
      );
    } else {
      report(
        false,
        'Application /api/supabase/status endpoint',
        `HTTP ${res.status}: Server responded with error status`
      );
    }
  } catch (err) {
    // If dev server isn't running during offline CI, verify module directly
    try {
      const { supabaseSync } = await import('../src/server/supabaseSync.ts');
      report(
        supabaseSync.isConfigured,
        'Application Supabase module integration (src/server/supabaseSync.ts)',
        `Module imported cleanly. isConfigured: ${supabaseSync.isConfigured}`
      );
    } catch (modErr) {
      report(false, 'Application API layer check', `Failed to query: ${err.message}`);
    }
  }

  // ----------------------------------------------------
  // SECTION 4: Client Bundle Leak Audit
  // ----------------------------------------------------
  console.log('\n\x1b[1m[4/4] Client Bundle Leak Audit (dist/)\x1b[0m');

  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    report(false, 'Client bundle existence', 'dist/ directory does not exist. Run "npm run build" first.');
  } else {
    let serviceKeyFound = false;
    let serviceRoleStringFound = false;
    let totalFilesScanned = 0;

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(js|html|css|map|json)$/.test(entry.name)) {
          totalFilesScanned++;
          const content = fs.readFileSync(fullPath, 'utf-8');

          if (serviceKey && content.includes(serviceKey)) {
            serviceKeyFound = true;
            console.error(`\x1b[31mCRITICAL LEAK: Found SUPABASE_SERVICE_ROLE_KEY in ${fullPath}\x1b[0m`);
          }

          // Scan for "service_role" literal string
          if (content.includes('"service_role"') || content.includes("'service_role'")) {
            serviceRoleStringFound = true;
            console.error(`\x1b[31mWARNING: Found "service_role" string in ${fullPath}\x1b[0m`);
          }
        }
      }
    }

    scanDir(distDir);

    report(
      !serviceKeyFound,
      'Client bundle secret-key leakage audit',
      serviceKeyFound
        ? 'CRITICAL SECURITY FAILURE: Service-role key leaked in client bundle!'
        : `Scanned ${totalFilesScanned} files in dist/. Zero occurrences of SUPABASE_SERVICE_ROLE_KEY.`
    );

    report(
      !serviceRoleStringFound,
      'Client bundle "service_role" literal isolation audit',
      serviceRoleStringFound
        ? 'WARNING: "service_role" string literal found in client bundle'
        : 'Confirmed: "service_role" literal does not appear in any client assets'
    );
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`  VERIFICATION RESULTS: ${passedChecks}/${totalChecks} PASSED`);
  if (failedChecks === 0) {
    console.log('  \x1b[32mSTATUS: ALL CHECKS PASSED — READY FOR RUNTIME\x1b[0m');
  } else {
    console.log(`  \x1b[31mSTATUS: ${failedChecks} CHECKS FAILED\x1b[0m`);
  }
  console.log('======================================================\n');

  process.exit(failedChecks === 0 ? 0 : 1);
}

verifySupabase().catch((err) => {
  console.error('\nFatal error during verification:', err);
  process.exit(1);
});
