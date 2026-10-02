import { onRequestPost as sageChatPost } from '../functions/api/sage/chat';
import { getAuthenticatedSupabaseClient } from '../functions/_lib/supabaseAuth';
import { onRequest as autoClockOutOnRequest } from '../functions/api/staff-attendance/auto-clock-out';
import * as fs from 'fs';
import * as path from 'path';

async function runSecurityVerification() {
  console.log('--- Starting Supabase Security Environment Verification ---');

  // 1. Check source files for hardcoded JWT secret pattern 'eyJhbGci'
  const targetFiles = [
    'functions/api/sage/chat.ts',
    'functions/_lib/supabaseAuth.ts',
    'functions/api/staff-attendance/auto-clock-out.ts',
  ];

  for (const relPath of targetFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('eyJhbGci')) {
      throw new Error(`[SECURITY FAIL] Hardcoded JWT key found in ${relPath}!`);
    }
    console.log(`✓ [PASS] No hardcoded JWT key found in ${relPath}`);
  }

  // 2. Test sageChatPost without Supabase credentials in env
  const mockContextMissingEnv: any = {
    request: new Request('http://localhost/api/sage/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test message' }],
      }),
    }),
    env: {},
  };

  const sageResMissingEnv = await sageChatPost(mockContextMissingEnv);
  if (sageResMissingEnv.status !== 500) {
    throw new Error(`[SECURITY FAIL] Expected 500 when Supabase env vars missing in sage chat, got ${sageResMissingEnv.status}`);
  }
  const sageErrBody = await sageResMissingEnv.json();
  if (!sageErrBody.error?.includes('missing')) {
    throw new Error(`[SECURITY FAIL] Unexpected error message: ${JSON.stringify(sageErrBody)}`);
  }
  console.log('✓ [PASS] Sage chat API correctly rejects request with 500 error when Supabase env vars are missing');

  // 3. Test getAuthenticatedSupabaseClient without Supabase credentials in env
  const mockAuthReq = new Request('http://localhost/api/test', {
    headers: { Authorization: 'Bearer test-token-123' },
  });
  const authResMissingEnv = getAuthenticatedSupabaseClient(mockAuthReq, {} as any);
  if (authResMissingEnv !== null) {
    throw new Error('[SECURITY FAIL] Expected null from getAuthenticatedSupabaseClient when env vars missing');
  }
  console.log('✓ [PASS] getAuthenticatedSupabaseClient returns null when Supabase env vars are missing');

  // 4. Test autoClockOutOnRequest without Supabase credentials in env
  const autoClockResMissingEnv = await autoClockOutOnRequest({
    request: new Request('http://localhost/api/staff-attendance/auto-clock-out'),
    env: {},
  } as any);
  if (autoClockResMissingEnv.status !== 500) {
    throw new Error(`[SECURITY FAIL] Expected 500 when Supabase env vars missing in auto clock out, got ${autoClockResMissingEnv.status}`);
  }
  console.log('✓ [PASS] Auto clock out API correctly rejects request with 500 error when Supabase env vars are missing');

  console.log('--- All Security Verifications Passed Successfully! ---');
}

runSecurityVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
