import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exec = promisify(execFile);
const CLI = 'dist/cli.js';

// Use a temp HOME so config file doesn't interfere
const fakeHome = mkdtempSync(join(tmpdir(), 'gamma-test-'));
const noKeyEnv = { ...process.env, GAMMA_API_KEY: '', HOME: fakeHome, USERPROFILE: fakeHome };

describe('CLI', () => {
  it('shows help', async () => {
    const { stdout } = await exec('node', [CLI, '--help']);
    assert.ok(stdout.includes('gamma'));
    assert.ok(stdout.includes('generate'));
    assert.ok(stdout.includes('template'));
    assert.ok(stdout.includes('themes'));
    assert.ok(stdout.includes('folders'));
    assert.ok(stdout.includes('status'));
    assert.ok(stdout.includes('--format'));
  });

  it('shows version', async () => {
    const { stdout } = await exec('node', [CLI, '--version']);
    assert.ok(stdout.trim().match(/^\d+\.\d+\.\d+$/));
  });

  it('generate --help shows all options', async () => {
    const { stdout } = await exec('node', [CLI, 'generate', '--help']);
    assert.ok(stdout.includes('--input'));
    assert.ok(stdout.includes('--mode'));
    assert.ok(stdout.includes('--type'));
    assert.ok(stdout.includes('--no-wait'));
    assert.ok(stdout.includes('--dry-run'));
    assert.ok(stdout.includes('--json-body'));
  });

  it('template --help shows required options', async () => {
    const { stdout } = await exec('node', [CLI, 'template', '--help']);
    assert.ok(stdout.includes('--gamma-id'));
    assert.ok(stdout.includes('--prompt'));
  });

  it('errors with JSON when no API key (env or config)', async () => {
    try {
      await exec('node', [CLI, 'themes'], { env: noKeyEnv });
      assert.fail('should have thrown');
    } catch (err) {
      const stderr = err.stderr;
      const parsed = JSON.parse(stderr.trim());
      assert.ok(parsed.error.includes('No API key found'));
      assert.ok(parsed.hint);
    }
  });

  it('exits with code 1 on missing API key', async () => {
    try {
      await exec('node', [CLI, 'folders'], { env: noKeyEnv });
      assert.fail('should have thrown');
    } catch (err) {
      assert.equal(err.code, 1);
    }
  });

  it('validates enum values locally', async () => {
    try {
      await exec('node', [CLI, 'generate', '-i', 'test', '--mode', 'badvalue'], { env: noKeyEnv });
      assert.fail('should have thrown');
    } catch (err) {
      const parsed = JSON.parse(err.stderr.trim());
      assert.ok(parsed.error.includes('Invalid value for mode'));
      assert.ok(parsed.allowed.includes('generate'));
    }
  });

  it('dry-run outputs body without calling API', async () => {
    const { stdout } = await exec('node', [CLI, 'generate', '-i', 'hello world', '-m', 'generate', '--dry-run'], { env: noKeyEnv });
    const parsed = JSON.parse(stdout.trim());
    assert.equal(parsed.dryRun, true);
    assert.equal(parsed.body.inputText, 'hello world');
    assert.equal(parsed.body.textMode, 'generate');
  });
});
