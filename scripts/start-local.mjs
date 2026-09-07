import { execSync, spawn } from 'node:child_process';

const DEFAULT_LOCAL_URL = 'http://127.0.0.1:54321';
const DEFAULT_STUDIO_URL = 'http://127.0.0.1:54323';

function getLocalSupabaseConfig() {
  try {
    const rawOutput = execSync('npx supabase status -o json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const url = parsed.API_URL || DEFAULT_LOCAL_URL;
      const anonKey =
        parsed.ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY;
      const studioUrl = parsed.STUDIO_URL || DEFAULT_STUDIO_URL;

      if (!anonKey) {
        throw new Error('No se pudo obtener la clave anónima desde Supabase status.');
      }

      return { url, anonKey, studioUrl };
    }
  } catch (err) {
    console.warn(
      '⚠️ No se pudo leer la configuración dinámica desde "supabase status". Usando variables de entorno si están disponibles.',
      err.message
    );
  }

  const fallbackUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_LOCAL_URL;
  const fallbackAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!fallbackAnonKey) {
    console.error(
      '❌ No se encontró una clave anónima válida para Supabase. Asegúrate de que el contenedor de Supabase esté corriendo.'
    );
    process.exit(1);
  }

  return {
    url: fallbackUrl,
    anonKey: fallbackAnonKey,
    studioUrl: DEFAULT_STUDIO_URL,
  };
}

async function startLocal() {
  console.log('🚀 [AquaGuest] Starting local Supabase stack...');

  try {
    execSync('npx supabase start', { stdio: 'inherit' });
  } catch (err) {
    console.error(
      '❌ Failed to start Supabase. Please ensure Docker is running.'
    );
    process.exit(err.status ?? 1);
  }

  const { url, anonKey, studioUrl } = getLocalSupabaseConfig();

  console.log('\n=============================================');
  console.log('✅ Supabase local stack ready:');
  console.log(`   - API URL:    ${url}`);
  console.log(`   - Studio:     ${studioUrl}`);
  console.log(
    `   - Database:   postgresql://postgres:postgres@127.0.0.1:54322/postgres`
  );
  console.log('=============================================\n');
  console.log(
    '🌐 [AquaGuest] Launching web-app with local Supabase configuration...\n'
  );

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
