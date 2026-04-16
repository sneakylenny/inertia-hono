import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Read script and stylesheet URLs from Vite's `dist/index.html` after `vite build`.
 */
export function readProdClientAssets(distDir: string): {
  scriptSrc: string
  styleHref: string | null
} {
  const indexPath = join(distDir, 'index.html')
  if (!existsSync(indexPath)) {
    return { scriptSrc: '/assets/main.js', styleHref: null }
  }
  const html = readFileSync(indexPath, 'utf-8')
  const script = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1]
  const style = html.match(/href="(\/assets\/[^"]+\.css)"/)?.[1]
  return {
    scriptSrc: script ?? '/assets/main.js',
    styleHref: style ?? null,
  }
}
