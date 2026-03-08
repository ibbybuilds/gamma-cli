import type { Command } from 'commander';
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { output, errorOutput, type OutputOpts } from '../utils/output.js';

const TARGETS: Record<string, string> = {
  claude: join(homedir(), '.claude', 'skills', 'gamma'),
  cursor: join('.cursor', 'skills', 'gamma'),
  copilot: join('.cursor', 'skills', 'gamma'),
  windsurf: join('.windsurf', 'skills', 'gamma'),
  aios: join('.aios', 'skills', 'gamma'),
};

function getSkillPath(): string {
  // When installed via npm, SKILL.md is at <pkg>/skills/gamma/SKILL.md
  // __dirname resolves to dist/, so go up one level
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return join(thisDir, '..', 'skills', 'gamma', 'SKILL.md');
}

export function registerSkill(program: Command): void {
  program
    .command('skill')
    .description('Print or install the gamma agent skill (SKILL.md)')
    .option('--install <target>', `Install skill for an agent: ${Object.keys(TARGETS).join(', ')}`)
    .option('--path', 'Print the path to SKILL.md instead of its content')
    .action((opts: { install?: string; path?: boolean }, cmdObj: Command) => {
      const parentOpts = cmdObj.parent!.opts() as OutputOpts;
      const skillPath = getSkillPath();

      if (!existsSync(skillPath)) {
        errorOutput(new Error(`SKILL.md not found at ${skillPath}. Is gamma-cli installed correctly?`));
        process.exit(1);
      }

      // --path: just print location
      if (opts.path) {
        output({ path: skillPath }, parentOpts);
        return;
      }

      // --install <target>: copy to the right directory
      if (opts.install) {
        const target = opts.install.toLowerCase();
        const dest = TARGETS[target];
        if (!dest) {
          errorOutput(new Error(`Unknown target "${opts.install}". Use one of: ${Object.keys(TARGETS).join(', ')}`));
          process.exit(1);
        }

        try {
          mkdirSync(dest, { recursive: true });
          const destFile = join(dest, 'SKILL.md');
          copyFileSync(skillPath, destFile);
          output({ ok: true, target, installed: destFile }, parentOpts);
        } catch (err) {
          errorOutput(err as Error);
          process.exit(1);
        }
        return;
      }

      // Default: print SKILL.md content to stdout (raw, not JSON-wrapped)
      // This lets agents pipe it: gamma skill | cat
      const content = readFileSync(skillPath, 'utf-8');
      process.stdout.write(content);
    });
}
