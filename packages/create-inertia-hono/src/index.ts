import * as p from '@clack/prompts'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const TEMPLATE_DIR = join(__dirname, '..', 'template')

const orange = (text: string) => `\x1b[38;2;227;96;2m${text}\x1b[39m`
const bold = (text: string) => `\x1b[1m${text}\x1b[22m`

const RUNTIMES = ['node', 'bun'] as const
type Runtime = typeof RUNTIMES[number]

type CliArgs = {
  projectName?: string
  runtime?: Runtime
}

function isEmptyDir(path: string): boolean {
  return readdirSync(path).length === 0
}

function detectPackageManager(): 'npm' | 'pnpm' | 'yarn' | 'bun' {
  const ua = process.env.npm_config_user_agent
  if (ua) {
    if (ua.startsWith('bun')) return 'bun'
    if (ua.startsWith('pnpm')) return 'pnpm'
    if (ua.startsWith('yarn')) return 'yarn'
  }
  return 'npm'
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--runtime' || arg === '-r') {
      const value = argv[++i]
      if (!value || !(RUNTIMES as readonly string[]).includes(value)) {
        p.cancel(`--runtime must be one of: ${RUNTIMES.join(', ')}`)
        process.exit(1)
      }
      args.runtime = value as Runtime
    }
    else if (arg.startsWith('--runtime=')) {
      const value = arg.slice('--runtime='.length)
      if (!(RUNTIMES as readonly string[]).includes(value)) {
        p.cancel(`--runtime must be one of: ${RUNTIMES.join(', ')}`)
        process.exit(1)
      }
      args.runtime = value as Runtime
    }
    else if (!arg.startsWith('-') && args.projectName === undefined) {
      args.projectName = arg
    }
  }
  return args
}

async function main() {
  p.intro(orange(bold('create-inertia-hono')))

  const { projectName: argDir, runtime: argRuntime } = parseArgs(process.argv.slice(2))
  const pm = detectPackageManager()

  const projectName = argDir ?? await p.text({
    message: 'Project name',
    placeholder: 'my-inertia-app',
    validate(value) {
      if (!value || !value.trim()) return 'Project name is required'
    },
  })

  if (p.isCancel(projectName)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const runtime: Runtime = argRuntime ?? (await p.select({
    message: 'Runtime',
    options: [
      { value: 'node', label: 'Node.js', hint: '@hono/node-server + tsx' },
      { value: 'bun', label: 'Bun', hint: 'Bun.serve via default export' },
    ],
    initialValue: pm === 'bun' ? 'bun' : 'node',
  })) as Runtime

  if (p.isCancel(runtime)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const targetDir = resolve(String(projectName))
  const dirName = basename(targetDir)

  if (existsSync(targetDir) && !isEmptyDir(targetDir)) {
    p.cancel(`Directory "${dirName}" already exists and is not empty.`)
    process.exit(1)
  }

  const confirm = await p.confirm({
    message: `Scaffold ${orange(runtime)} project into ${orange(targetDir)}?`,
    initialValue: true,
  })

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const spinner = p.spinner()
  spinner.start(orange('Scaffolding project...'))

  mkdirSync(targetDir, { recursive: true })
  cpSync(join(TEMPLATE_DIR, 'base'), targetDir, { recursive: true })
  cpSync(join(TEMPLATE_DIR, runtime), targetDir, { recursive: true })

  const pkgPath = join(targetDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.name = dirName
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  spinner.stop(orange('Project scaffolded.'))

  const installPm = runtime === 'bun' ? 'bun' : pm
  p.note(
    `cd ${dirName}\n${installPm} install\n${installPm} run dev`,
    orange('Next steps'),
  )

  p.outro(orange(bold('All done! 🚀')))
}

main().catch(console.error)
