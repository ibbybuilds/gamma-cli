import type { Command } from 'commander';
import { get, pollGeneration } from '../utils/api.js';
import { output, errorOutput, type OutputOpts } from '../utils/output.js';

interface StatusOpts {
  wait?: boolean;
  pollInterval: number;
  timeout: number;
}

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('Check the status of a generation')
    .argument('<generationId>', 'Generation ID to check')
    .option('--wait', 'Wait for completion')
    .option('--poll-interval <ms>', 'Poll interval in milliseconds', parseInt, 5000)
    .option('--timeout <ms>', 'Timeout in milliseconds', parseInt, 300000)
    .action(async (generationId: string, opts: StatusOpts, cmd: Command) => {
      try {
        const parentOpts = cmd.parent!.opts() as OutputOpts;
        const outOpts: OutputOpts = { ...parentOpts };

        if (opts.wait) {
          const result = await pollGeneration(generationId, {
            interval: opts.pollInterval,
            timeout: opts.timeout,
          });
          output(result, outOpts);
          process.exit(result.status === 'completed' ? 0 : 1);
        } else {
          const result = await get(`/generations/${generationId}`);
          output(result, outOpts);
        }
      } catch (err) {
        errorOutput(err as Error);
      }
    });
}
