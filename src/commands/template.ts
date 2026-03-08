import type { Command } from 'commander';
import { post, pollGeneration } from '../utils/api.js';
import { output, errorOutput, type OutputOpts } from '../utils/output.js';
import { validate } from '../utils/validate.js';
import { openUrl } from '../utils/open.js';

interface TemplateOpts {
  gammaId: string;
  prompt: string;
  theme?: string;
  folders?: string[];
  export?: string;
  imageModel?: string;
  imageStyle?: string;
  sharingWorkspace?: string;
  sharingExternal?: string;
  email?: string[];
  emailAccess?: string;
  jsonBody?: string;
  open?: boolean;
  wait: boolean;
  pollInterval: number;
  timeout: number;
  dryRun?: boolean;
}

export function registerTemplate(program: Command): void {
  program
    .command('template')
    .description('Create a gamma from an existing template')
    .requiredOption('-g, --gamma-id <id>', 'Template gamma ID')
    .option('-p, --prompt <text>', 'Prompt with content and instructions (or @filepath)')
    .option('-t, --theme <id>', 'Theme ID (defaults to template theme)')
    .option('--folders <ids...>', 'Folder IDs to store in')
    .option('--export <fmt>', 'Export as: pdf or pptx')
    .option('--image-model <model>', 'AI image generation model ID')
    .option('--image-style <style>', 'Image style description')
    .option('--sharing-workspace <level>', 'Workspace access level')
    .option('--sharing-external <level>', 'External access level')
    .option('--email <addresses...>', 'Email addresses to share with')
    .option('--email-access <level>', 'Access level for email recipients')
    .option('--json-body <json>', 'Raw JSON request body (overrides other options)')
    .option('--open', 'Open the result in browser when complete')
    .option('--no-wait', 'Return generation ID immediately without waiting')
    .option('--poll-interval <ms>', 'Poll interval in milliseconds', parseInt, 5000)
    .option('--timeout <ms>', 'Timeout in milliseconds', parseInt, 300000)
    .option('--dry-run', 'Print the request body without sending')
    .action(async (opts: TemplateOpts, cmd: Command) => {
      try {
        const parentOpts = cmd.parent!.opts() as OutputOpts;
        const outOpts: OutputOpts = { ...parentOpts };

        let body: Record<string, unknown>;

        if (opts.jsonBody) {
          try {
            body = JSON.parse(opts.jsonBody);
          } catch {
            errorOutput(new Error('Invalid JSON in --json-body'));
          }
        } else {
          if (opts.export) validate('exportFormat', opts.export);
          if (opts.sharingWorkspace) validate('workspaceAccess', opts.sharingWorkspace);
          if (opts.sharingExternal) validate('externalAccess', opts.sharingExternal);

          const prompt = opts.prompt ? await resolveInput(opts.prompt) : undefined;
          body = { gammaId: opts.gammaId };
          if (prompt) body.prompt = prompt;
          if (opts.theme) body.themeId = opts.theme;
          if (opts.folders) body.folderIds = opts.folders;
          if (opts.export) body.exportAs = opts.export;

          const imageOptions: Record<string, string> = {};
          if (opts.imageModel) imageOptions.model = opts.imageModel;
          if (opts.imageStyle) imageOptions.style = opts.imageStyle;
          if (Object.keys(imageOptions).length) body.imageOptions = imageOptions;

          const sharingOptions: Record<string, unknown> = {};
          if (opts.sharingWorkspace) sharingOptions.workspaceAccess = opts.sharingWorkspace;
          if (opts.sharingExternal) sharingOptions.externalAccess = opts.sharingExternal;
          if (opts.email) {
            sharingOptions.emailOptions = {
              recipients: opts.email,
              ...(opts.emailAccess && { access: opts.emailAccess }),
            };
          }
          if (Object.keys(sharingOptions).length) body.sharingOptions = sharingOptions;
        }

        if (opts.dryRun) {
          output({ dryRun: true, method: 'POST', path: '/v1.0/generations/from-template', body }, outOpts);
          return;
        }

        const result = await post('/generations/from-template', body!);
        const generationId = result.generationId as string;

        if (!opts.wait) {
          output({ generationId, status: 'submitted' }, outOpts);
          return;
        }

        const final = await pollGeneration(generationId, {
          interval: opts.pollInterval,
          timeout: opts.timeout,
        });
        output(final, outOpts);
        if (opts.open && final.gammaUrl) openUrl(final.gammaUrl as string);
        process.exit(final.status === 'completed' ? 0 : 1);
      } catch (err) {
        errorOutput(err as Error);
      }
    });
}

async function resolveInput(input: string): Promise<string> {
  if (input.startsWith('@')) {
    const { readFile } = await import('node:fs/promises');
    return readFile(input.slice(1), 'utf-8');
  }
  return input;
}
