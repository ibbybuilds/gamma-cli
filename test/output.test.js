import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const CLI = 'dist/cli.js';

// Set a dummy key so we hit the API (which returns JSON errors we can parse)
const env = { ...process.env, GAMMA_API_KEY: 'test_dummy_key' };

describe('output formatting', () => {
  it('outputs JSON by default', async () => {
    try {
      await exec('node', [CLI, 'themes'], { env });
    } catch (err) {
      // API will reject the key, but error output is JSON
      const parsed = JSON.parse(err.stderr.trim());
      assert.ok(typeof parsed === 'object');
      assert.ok('error' in parsed);
    }
  });

  it('--pretty flag is accepted', async () => {
    const { stdout } = await exec('node', [CLI, '--help']);
    assert.ok(stdout.includes('--pretty'));
    assert.ok(stdout.includes('--format'));
  });

  it('--format table is accepted', async () => {
    const { stdout } = await exec('node', [CLI, '--help']);
    assert.ok(stdout.includes('json, table, yaml'));
  });

  it('config list outputs JSON by default', async () => {
    const { stdout } = await exec('node', [CLI, 'config', 'list']);
    const parsed = JSON.parse(stdout.trim());
    assert.ok(typeof parsed === 'object');
  });

  it('config list with --format table outputs readable text', async () => {
    // Set a temp value first
    await exec('node', [CLI, 'config', 'set', 'testKey', 'testVal']);
    const { stdout } = await exec('node', [CLI, '--format', 'table', 'config', 'list']);
    assert.ok(stdout.includes('testKey'));
    assert.ok(stdout.includes('testVal'));
    // Clean up
    await exec('node', [CLI, 'config', 'delete', 'testKey']);
  });
});
