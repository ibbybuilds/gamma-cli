import type { Command } from 'commander';
import { getConfig, setConfig, deleteConfig, getAllConfig } from '../utils/config.js';
import { output, errorOutput, type OutputOpts } from '../utils/output.js';

export function registerConfig(program: Command): void {
  const cmd = program
    .command('config')
    .description('Manage CLI configuration (API key, defaults)');

  cmd
    .command('set')
    .description('Set a config value')
    .argument('<key>', 'Config key (e.g. apiKey)')
    .argument('<value>', 'Config value')
    .action((key: string, value: string, _opts: unknown, cmdObj: Command) => {
      try {
        setConfig(key, value);
        const parentOpts = cmdObj.parent!.parent!.opts() as OutputOpts;
        const display = key === 'apiKey' ? value.slice(0, 8) + '...' : value;
        output({ ok: true, key, value: display }, parentOpts);
      } catch (err) {
        errorOutput(err as Error);
      }
    });

  cmd
    .command('get')
    .description('Get a config value')
    .argument('<key>', 'Config key')
    .action((key: string, _opts: unknown, cmdObj: Command) => {
      try {
        const parentOpts = cmdObj.parent!.parent!.opts() as OutputOpts;
        const value = getConfig(key);
        if (value === undefined) {
          output({ key, value: null }, parentOpts);
        } else {
          const display = key === 'apiKey' ? value.slice(0, 8) + '...' : value;
          output({ key, value: display }, parentOpts);
        }
      } catch (err) {
        errorOutput(err as Error);
      }
    });

  cmd
    .command('delete')
    .description('Delete a config value')
    .argument('<key>', 'Config key')
    .action((key: string, _opts: unknown, cmdObj: Command) => {
      try {
        const parentOpts = cmdObj.parent!.parent!.opts() as OutputOpts;
        deleteConfig(key);
        output({ ok: true, key, deleted: true }, parentOpts);
      } catch (err) {
        errorOutput(err as Error);
      }
    });

  cmd
    .command('list')
    .description('Show all config values')
    .action((_opts: unknown, cmdObj: Command) => {
      try {
        const parentOpts = cmdObj.parent!.parent!.opts() as OutputOpts;
        const config = getAllConfig();
        const safe = { ...config };
        if (safe.apiKey) safe.apiKey = safe.apiKey.slice(0, 8) + '...';
        output(safe, parentOpts);
      } catch (err) {
        errorOutput(err as Error);
      }
    });
}
