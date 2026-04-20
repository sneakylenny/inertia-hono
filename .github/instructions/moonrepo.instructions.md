---
name: Moonrepo workflow
description: Understand that this repository is organized and orchestrated with Moonrepo.
applyTo: "**"
---

This repository uses Moonrepo for task orchestration and project relationships.
When working in this codebase, treat Moon as the source of truth for builds, tests, linting, and app startup.

## General Rules

- Prefer Moon tasks over ad-hoc commands whenever a project task exists.
- For workspace-wide validation, prefer running Moon from the repository root.
- For project-scoped work, run the specific project task instead of unrelated root scripts.
- Read each project's `moon.yml` to understand dependencies and task inputs/outputs before making changes.
- Assume project dependencies matter: if a library changes, dependent apps may need to be rebuilt or retested.

## Preferred Commands

From the repository root:

- Run all builds: `moon run :build`
- Run all tests: `moon run :test`
- Run all lint checks: `moon run :lint`

Project-scoped examples:

- Build the adapter package: `moon run inertia-hono:build`
- Test the protocol package: `moon run inertia-server:test`
- Start the demo app: `moon run playground:dev`
- Lint the demo app: `moon run playground:lint`

## Agent Guidance

- Before changing code, identify which Moon project owns the files you are editing.
- After changing shared library code, validate the affected dependents too.
- When a task already exists in Moon, do not invent a parallel workflow.
- Use Bun inside project tasks, but let Moon coordinate cross-project execution.
- If unsure what to run, start with the nearest project task, then expand to dependent projects as needed.
