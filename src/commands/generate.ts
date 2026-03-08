import type { Command } from 'commander';
import { post, pollGeneration } from '../utils/api.js';
import { output, errorOutput, type OutputOpts } from '../utils/output.js';
import { validate, validateNumCards } from '../utils/validate.js';
import { openUrl } from '../utils/open.js';

interface GenerateOpts {
  input?: string;
  mode: string;
  type?: string;
  theme?: string;
  numCards?: number;
  cardSplit?: string;
  instructions?: string;
  folders?: string[];
  export?: string;
  amount?: string;
  tone?: string;
  audience?: string;
  language?: string;
  imageSource?: string;
  imageModel?: string;
  imageStyle?: string;
  dimensions?: string;
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

export function registerGenerate(program: Command): void {
  program
    .command('generate')
    .description('Generate a presentation, document, webpage, or social post')
    .option('-i, --input <text>', 'Input text (or @filepath to read from file, or - for stdin)')
    .option('-m, --mode <mode>', 'Text mode: generate, condense, or preserve', 'generate')
    .option('--type <type>', 'Content type: presentation, document, webpage, social')
    .option('-t, --theme <id>', 'Theme ID')
    .option('-n, --num-cards <n>', 'Number of cards (1-75)', parseInt)
    .option('--card-split <mode>', 'Card split: auto or inputTextBreaks')
    .option('--instructions <text>', 'Additional instructions (max 2000 chars)')
    .option('--folders <ids...>', 'Folder IDs to store in')
    .option('--export <fmt>', 'Export as: pdf or pptx')
    .option('--amount <level>', 'Text amount: brief, medium, detailed, extensive')
    .option('--tone <tone>', 'Tone/voice style')
    .option('--audience <audience>', 'Target audience')
    .option('--language <lang>', 'Language code (e.g. en, es, fr)')
    .option('--image-source <source>', 'Image source: aiGenerated, pictographic, pexels, giphy, webAllImages, noImages')
    .option('--image-model <model>', 'AI image generation model ID')
    .option('--image-style <style>', 'Image style description')
    .option('--dimensions <dim>', 'Card dimensions: fluid, 16x9, 4x3, 1x1, etc.')
    .option('--sharing-workspace <level>', 'Workspace access: noAccess, view, comment, edit, fullAccess')
    .option('--sharing-external <level>', 'External access: noAccess, view, comment, edit')
    .option('--email <addresses...>', 'Email addresses to share with')
    .option('--email-access <level>', 'Access level for email recipients: view, comment, edit, fullAccess')
    .option('--json-body <json>', 'Raw JSON request body (overrides all other options except --no-wait)')
    .option('--no-wait', 'Return generation ID immediately without waiting')
    .option('--poll-interval <ms>', 'Poll interval in milliseconds', parseInt, 5000)
    .option('--timeout <ms>', 'Timeout in milliseconds', parseInt, 300000)
    .option('--dry-run', 'Print the request body without sending')
    .option('--open', 'Open the result in browser when complete')
    .action(async (opts: GenerateOpts, cmd: Command) => {
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
          // Validate enum fields
          validate('mode', opts.mode);
          validate('type', opts.type);
          validate('amount', opts.amount);
          validate('imageSource', opts.imageSource);
          validate('cardSplit', opts.cardSplit);
          if (opts.export) validate('exportFormat', opts.export);
          if (opts.sharingWorkspace) validate('workspaceAccess', opts.sharingWorkspace);
          if (opts.sharingExternal) validate('externalAccess', opts.sharingExternal);
          validateNumCards(opts.numCards);

          const inputText = await resolveInput(opts.input);
          body = buildBody(inputText, opts);
        }

        if (opts.dryRun) {
          output({ dryRun: true, method: 'POST', path: '/v1.0/generations', body }, outOpts);
          return;
        }

        const result = await post('/generations', body!);
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

function buildBody(inputText: string, opts: GenerateOpts): Record<string, unknown> {
  const body: Record<string, unknown> = {
    inputText,
    textMode: opts.mode,
  };

  if (opts.type) body.format = opts.type;
  if (opts.theme) body.themeId = opts.theme;
  if (opts.numCards) body.numCards = opts.numCards;
  if (opts.cardSplit) body.cardSplit = opts.cardSplit;
  if (opts.instructions) body.additionalInstructions = opts.instructions;
  if (opts.folders) body.folderIds = opts.folders;
  if (opts.export) body.exportAs = opts.export;

  // textOptions - only include fields the user explicitly set
  const textOptions: Record<string, string> = {};
  if (opts.amount) textOptions.amount = opts.amount;
  if (opts.tone) textOptions.tone = opts.tone;
  if (opts.audience) textOptions.audience = opts.audience;
  if (opts.language) textOptions.language = opts.language;
  if (Object.keys(textOptions).length) body.textOptions = textOptions;

  // imageOptions
  const imageOptions: Record<string, string> = {};
  if (opts.imageSource) imageOptions.source = opts.imageSource;
  if (opts.imageModel) imageOptions.model = opts.imageModel;
  if (opts.imageStyle) imageOptions.style = opts.imageStyle;
  if (Object.keys(imageOptions).length) body.imageOptions = imageOptions;

  // cardOptions
  if (opts.dimensions) {
    body.cardOptions = { dimensions: opts.dimensions };
  }

  // sharingOptions
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

  return body;
}

async function resolveInput(input?: string): Promise<string> {
  if (!input || input === '-') {
    return readStdin();
  }
  if (input.startsWith('@')) {
    const { readFile } = await import('node:fs/promises');
    return readFile(input.slice(1), 'utf-8');
  }
  return input;
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      reject(new Error('No input provided. Use -i <text>, -i @file, or pipe via stdin'));
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}
