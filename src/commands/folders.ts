import type { Command } from 'commander';
import { get } from '../utils/api.js';
import { output, errorOutput, type OutputOpts } from '../utils/output.js';

interface FoldersOpts {
  query?: string;
  limit?: number;
  after?: string;
  all?: boolean;
}

export function registerFolders(program: Command): void {
  program
    .command('folders')
    .description('List available folders')
    .option('-q, --query <search>', 'Search folders by name')
    .option('-l, --limit <n>', 'Max results per page (max 50)', parseInt)
    .option('--after <cursor>', 'Pagination cursor')
    .option('--all', 'Fetch all pages')
    .action(async (opts: FoldersOpts, cmd: Command) => {
      try {
        const parentOpts = cmd.parent!.opts() as OutputOpts;
        const outOpts: OutputOpts = { ...parentOpts };

        if (opts.all) {
          const allData: Record<string, unknown>[] = [];
          let cursor: string | undefined;
          do {
            const result = await get('/folders', {
              query: opts.query,
              limit: opts.limit || 50,
              after: cursor,
            });
            allData.push(...(result.data as Record<string, unknown>[]));
            cursor = result.hasMore ? (result.nextCursor as string) : undefined;
          } while (cursor);
          output(allData, outOpts);
        } else {
          const result = await get('/folders', {
            query: opts.query,
            limit: opts.limit,
            after: opts.after,
          });
          output(result, outOpts);
        }
      } catch (err) {
        errorOutput(err as Error);
      }
    });
}
