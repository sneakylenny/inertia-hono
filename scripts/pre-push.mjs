#!/usr/bin/env node
/**
 * Git pre-push hook: stdin lines are `<local_ref> <local_sha> <remote_ref> <remote_sha>`.
 * When any push updates `main`, run the same checks as `.github/workflows/ci.yml`.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

const input = readFileSync(0, 'utf-8').trim()
if (!input) process.exit(0)

for (const line of input.split('\n')) {
  const parts = line.split(/\s+/)
  const remoteRef = parts[2]
  if (remoteRef === 'refs/heads/main') {
    console.error('\nRunning CI checks before push to main…\n')
    const r = spawnSync('bun', ['run', 'ci'], {
      stdio: 'inherit',
      cwd: repoRoot,
    })
    process.exit(r.status ?? 1)
  }
}
