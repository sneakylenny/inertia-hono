import * as p from '@clack/prompts'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const TEMPLATE_DIR = join(__dirname, '..', 'template')

const orange = (text: string) => `\x1b[38;2;227;96;2m${text}\x1b[39m`
const bold = (text: string) => `\x1b[1m${text}\x1b[22m`

function isEmptyDir(path: string): boolean {
  return readdirSync(path).length === 0
}

function detectPackageManager(): string {
  const ua = process.env.npm_config_user_agent
  if (ua) {
    if (ua.startsWith('bun')) return 'bun'
    if (ua.startsWith('pnpm')) return 'pnpm'
    if (ua.startsWith('yarn')) return 'yarn'
  }
  return 'npm'
}

async function main() {
  p.intro(orange(bold('create-inertia-hono')))

  const argDir = process.argv[2]

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

  const targetDir = resolve(String(projectName))
  const dirName = basename(targetDir)

  if (existsSync(targetDir) && !isEmptyDir(targetDir)) {
    p.cancel(`Directory "${dirName}" already exists and is not empty.`)
    process.exit(1)
  }

  const confirm = await p.confirm({
    message: `Scaffold into ${orange(targetDir)}?`,
    initialValue: true,
  })

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const spinner = p.spinner()
  spinner.start(orange('Scaffolding project...'))

  mkdirSync(targetDir, { recursive: true })
  cpSync(TEMPLATE_DIR, targetDir, { recursive: true })

  const pkgPath = join(targetDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.name = dirName
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  spinner.stop(orange('Project scaffolded.'))

  const pm = detectPackageManager()

  p.note(
    `cd ${dirName}\n${pm} install\n${pm} run dev`,
    orange('Next steps'),
  )

  p.outro(orange(bold('All done! 🚀')))
}

main().catch(console.error)
