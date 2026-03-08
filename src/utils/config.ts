import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.gamma-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  apiKey?: string;
  [key: string]: string | undefined;
}

function load(): Config {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function save(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

export function getConfig(key: string): string | undefined {
  return load()[key];
}

export function setConfig(key: string, value: string): void {
  const config = load();
  config[key] = value;
  save(config);
}

export function deleteConfig(key: string): void {
  const config = load();
  delete config[key];
  save(config);
}

export function getAllConfig(): Config {
  return load();
}

export function getApiKey(): string {
  const envKey = process.env.GAMMA_API_KEY;
  if (envKey) return envKey;

  const configKey = getConfig('apiKey');
  if (configKey) return configKey;

  console.error(JSON.stringify({
    error: 'No API key found',
    hint: 'Set it with: gamma config set apiKey YOUR_KEY',
    alternatives: [
      'gamma config set apiKey YOUR_KEY  (persistent, stored in ~/.gamma-cli/config.json)',
      'export GAMMA_API_KEY=YOUR_KEY     (session only)',
    ]
  }));
  process.exit(1);
}
