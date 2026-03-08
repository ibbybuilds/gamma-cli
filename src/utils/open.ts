import { exec } from 'node:child_process';

export function openUrl(url: string): void {
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'start'
    : platform === 'darwin' ? 'open'
    : 'xdg-open';
  exec(`${cmd} "${url}"`);
}
