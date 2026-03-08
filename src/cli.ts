import { Command } from 'commander';
import { registerGenerate } from './commands/generate.js';
import { registerTemplate } from './commands/template.js';
import { registerThemes } from './commands/themes.js';
import { registerFolders } from './commands/folders.js';
import { registerStatus } from './commands/status.js';
import { registerConfig } from './commands/config.js';

const program = new Command();

program
  .name('gamma')
  .description('CLI for the Gamma API - create presentations, documents, and more')
  .version('0.1.0')
  .option('--format <fmt>', 'Output format: json, table, yaml', 'json')
  .option('--pretty', 'Shorthand for --format table');

registerGenerate(program);
registerTemplate(program);
registerThemes(program);
registerFolders(program);
registerStatus(program);
registerConfig(program);

program.parse();
