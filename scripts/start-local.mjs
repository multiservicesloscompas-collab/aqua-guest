import { execSync, spawn } from 'node:child_process';

const DEFAULT_LOCAL_URL = 'http://127.0.0.1:54321';
const DEFAULT_LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function getLocalSupabaseConfig() {
  try {
    const rawOutput = execSync('npx supabase status -o json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        url: parsed.API_URL || DEFAULT_LOCAL_URL,
        anonKey: parsed.ANON_KEY || DEFAULT_LOCAL_ANON_KEY,
        studioUrl: parsed.STUDIO_URL || 'http://127.0.0.1:54323',
      };
    }
  } catch {
    // Fall back to defaults if status parsing fails
  }

  return {
    url: DEFAULT_LOCAL_URL,
    anonKey: DEFAULT_LOCAL_ANON_KEY,
    studioUrl: 'http://127.0.0.1:54323',
  };
}

async function startLocal() {
  console.log('🚀 [AquaGuest] Starting local Supabase stack...');

  try {
    execSync('npx supabase start', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Failed to start Supabase. Please ensure Docker is running.');
    process.exit(err.status ?? 1);
  }

  const { url, anonKey, studioUrl } = getLocalSupabaseConfig();

  console.log('\n=============================================');
  console.log('✅ Supabase local stack ready:');
  console.log(`   - API URL:    ${url}`);
  console.log(`   - Studio:     ${studioUrl}`);
  console.log(`   - Database:   postgresql://postgres:postgres@127.0.0.1:54322/postgres`);
  console.log('=============================================\n');
  console.log('🌐 [AquaGuest] Launching web-app with local Supabase configuration...\n');

  const env = {
    ...process.env,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || url,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || anonKey,
    SUPABASE_URL: process.env.SUPABASE_URL || url,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || anonKey,
  };

  const child = spawn('npx', ['nx', 'serve', 'web-app'], {
    stdio: 'inherit',
    env,
    shell: true,
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

startLocal();
