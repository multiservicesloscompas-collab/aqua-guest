import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface E2EEnv {
  baseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function getE2EBaseUrl(): string {
  loadWebAppEnvIfPresent();
  return process.env.E2E_BASE_URL ?? 'http://localhost:4200';
}

let webAppEnvLoaded = false;

function loadWebAppEnvIfPresent(): void {
  if (webAppEnvLoaded) {
    return;
  }

  webAppEnvLoaded = true;

  const candidates = [
    resolve(process.cwd(), 'apps/web-app/.env'),
    resolve(process.cwd(), '../web-app/.env'),
  ];

  const envPath = candidates.find((candidate) => existsSync(candidate));
  if (!envPath) {
    return;
  }

  const raw = readFileSync(envPath, 'utf8');

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value.replace(/^['"]|['"]$/g, '');
  }
}

function getRequiredEnv(name: string, aliases: string[] = []): string {
  loadWebAppEnvIfPresent();

  const candidates = [name, ...aliases];
  const matchedName = candidates.find((candidate) => {
    const value = process.env[candidate];
    return typeof value === 'string' && value.trim().length > 0;
  });

  if (!matchedName) {
    throw new Error(
      `Missing required E2E env var: ${name}. Also checked aliases: ${
        aliases.join(', ') || 'none'
      }. ` +
        'Set the primary variable directly, or define one alias in apps/web-app/.env.'
    );
  }

  const value = process.env[matchedName];
  if (!value) {
    throw new Error(`Missing required E2E env var: ${matchedName}`);
  }

  return value;
}

export function getE2EEnv(): E2EEnv {
  loadWebAppEnvIfPresent();

  return {
    baseUrl: getE2EBaseUrl(),
    supabaseUrl: getRequiredEnv('VITE_SUPABASE_URL', ['SUPABASE_URL']),
    supabaseAnonKey: getRequiredEnv('VITE_SUPABASE_ANON_KEY', [
      'SUPABASE_ANON_KEY',
    ]),
  };
}
