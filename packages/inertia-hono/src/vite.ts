import { html, raw } from 'hono/html'
import type { HtmlEscapedString } from 'hono/utils/html'
import type { InertiaPage, ResolveInertiaInput } from '@sneakylenny/inertia-server'

/** Entry of a Vite build manifest (`dist/.vite/manifest.json`). */
export type ViteManifestEntry = {
  file: string
  src?: string
  name?: string
  isEntry?: boolean
  isDynamicEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
  css?: string[]
  assets?: string[]
}

/** A Vite build manifest keyed by source path (e.g. `src/main.ts`). */
export type ViteManifest = Record<string, ViteManifestEntry>

type HtmlContent = string | HtmlEscapedString
type HtmlContentInput
  = | HtmlContent
    | ((page: InertiaPage) => HtmlContent | Promise<HtmlContent>)

export type ViteHtmlRendererOptions = {
  /**
   * Client entry module. Used both as the dev-mode script src
   * (`${viteOrigin}/${entry}`) and as the key to look up the built asset in a
   * Vite manifest. Defaults to `src/main.ts`.
   */
  entry?: string
  /** Vite dev server origin. Defaults to `http://localhost:5173`. */
  viteOrigin?: string
  /**
   * When true, inject `@vite/client` and the dev-mode entry module.
   * When false, emit production `<script>`/`<link>` tags from `manifest`
   * (or `prodScriptSrc`/`prodStyleHref`). Defaults to `true`.
   */
  dev?: boolean
  /**
   * Vite build manifest (load via {@link readViteManifest}).
   * Required in production unless `prodScriptSrc` is provided.
   */
  manifest?: ViteManifest | null
  /** Public base path prefixed to manifest-relative asset URLs. Defaults to `/`. */
  base?: string
  /** Override the production entry script URL (bypasses `manifest`). */
  prodScriptSrc?: string
  /** Override the production stylesheet URL(s) (bypasses `manifest`). */
  prodStyleHref?: string | string[] | null
  /** `<html lang="...">`. Defaults to `"en"`. */
  lang?: string
  /** Extra `<html>` attributes, e.g. `{ 'data-theme': 'light' }`. */
  htmlAttrs?: Record<string, string>
  /** `class` applied to `<body>`. */
  bodyClass?: string
  /** Extra `<body>` attributes. */
  bodyAttrs?: Record<string, string>
  /** Produce the document `<title>`. Defaults to `page.component`. */
  title?: (page: InertiaPage) => string
  /** Extra content injected into `<head>` (after the default meta tags). */
  head?: HtmlContentInput
  /**
   * Inject the `@vitejs/plugin-react` refresh preamble in dev mode.
   * Set to `true` for React projects.
   */
  reactRefresh?: boolean
}

export type ViteHtmlRenderer = NonNullable<ResolveInertiaInput['renderHtml']>

/** Vite's asset manifest path (relative to `outDir`). */
export const VITE_MANIFEST_PATH = '.vite/manifest.json'

function joinUrl(origin: string, path: string): string {
  const o = origin.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${o}${p}`
}

function prefixBase(base: string, path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path)) return path
  const b = base.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${b || ''}/${p}`
}

function escapeAttrValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

/** Avoid `</script>` sequences breaking out of the embedded JSON. */
function escapeJsonForScript(json: string): string {
  return json.replace(/</g, '\\u003c')
}

function renderAttrs(attrs?: Record<string, string>): HtmlEscapedString {
  if (!attrs) return raw('')
  let out = ''
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue
    out += ` ${key}="${escapeAttrValue(String(value))}"`
  }
  return raw(out)
}

function reactRefreshPreamble(viteOrigin: string): HtmlEscapedString {
  const url = joinUrl(viteOrigin, '@react-refresh')
  return raw(
    `<script type="module">
import RefreshRuntime from "${escapeAttrValue(url)}"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>`,
  )
}

async function buildDevScripts(options: ViteHtmlRendererOptions) {
  const viteOrigin = options.viteOrigin ?? 'http://localhost:5173'
  const entry = options.entry ?? 'src/main.ts'
  const parts: (string | HtmlEscapedString)[] = []
  if (options.reactRefresh) parts.push(reactRefreshPreamble(viteOrigin))
  parts.push(
    await html`<script type="module" src="${joinUrl(viteOrigin, '@vite/client')}"></script>`,
  )
  parts.push(
    await html`<script type="module" src="${joinUrl(viteOrigin, entry)}"></script>`,
  )
  return parts
}

async function buildProdScripts(options: ViteHtmlRendererOptions) {
  const entry = options.entry ?? 'src/main.ts'
  const base = options.base ?? '/'
  const manifestEntry = options.manifest?.[entry]
  const scriptSrc
    = options.prodScriptSrc
      ?? (manifestEntry ? prefixBase(base, manifestEntry.file) : null)

  if (!scriptSrc) {
    throw new Error(
      `[inertia-hono] Vite manifest entry "${entry}" not found. `
      + `Pass \`manifest\` (from readViteManifest(distDir)) or \`prodScriptSrc\` to createViteHtmlRenderer.`,
    )
  }

  const styleHrefs: string[] = []
  if (options.prodStyleHref != null) {
    const list = Array.isArray(options.prodStyleHref)
      ? options.prodStyleHref
      : [options.prodStyleHref]
    for (const href of list) styleHrefs.push(href)
  }
  else if (manifestEntry?.css?.length) {
    for (const css of manifestEntry.css) styleHrefs.push(prefixBase(base, css))
  }

  const parts: (string | HtmlEscapedString)[] = []
  for (const href of styleHrefs) {
    parts.push(
      await html`<link rel="stylesheet" crossorigin href="${href}">`,
    )
  }
  parts.push(
    await html`<script type="module" crossorigin src="${scriptSrc}"></script>`,
  )
  return parts
}

async function resolveHead(
  head: HtmlContentInput | undefined,
  page: InertiaPage,
): Promise<HtmlContent> {
  if (!head) return ''
  return typeof head === 'function' ? await head(page) : head
}

/**
 * Build a Vite-aware HTML document renderer for the first (non-XHR) Inertia
 * visit. Wires the Inertia page `<script>` alongside either the Vite dev
 * server entry (HMR) or the built `<script>`/`<link>` tags from a Vite
 * manifest.
 *
 * @example
 * ```ts
 * import { readViteManifest, createViteHtmlRenderer } from 'inertia-hono'
 *
 * const isDev = process.env.NODE_ENV !== 'production'
 * createInertia({
 *   version: '1',
 *   renderHtml: createViteHtmlRenderer({
 *     dev: isDev,
 *     entry: 'src/main.ts',
 *     manifest: isDev ? null : readViteManifest('./dist'),
 *   }),
 * })
 * ```
 */
export function createViteHtmlRenderer(
  options: ViteHtmlRendererOptions = {},
): ViteHtmlRenderer {
  const dev = options.dev ?? true
  const lang = options.lang ?? 'en'

  return async ({ page, pageJson, rootElementId, pageScriptDataAttribute }) => {
    const safePageJson = raw(escapeJsonForScript(pageJson))
    const title = options.title ? options.title(page) : page.component
    const headExtra = await resolveHead(options.head, page)
    const scripts = dev
      ? await buildDevScripts(options)
      : await buildProdScripts(options)

    const htmlAttrs = renderAttrs(options.htmlAttrs)
    const bodyAttrs = renderAttrs(options.bodyAttrs)
    const bodyClass = options.bodyClass
      ? raw(` class="${escapeAttrValue(options.bodyClass)}"`)
      : raw('')

    const document = await html`<!DOCTYPE html>
<html lang="${lang}"${htmlAttrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title data-inertia="">${title}</title>
${headExtra}
</head>
<body${bodyClass}${bodyAttrs}>
<script data-page="${pageScriptDataAttribute}" type="application/json">${safePageJson}</script>
<div id="${rootElementId}"></div>
${scripts}
</body>
</html>`

    return document.toString()
  }
}

/**
 * Read Vite's build manifest (`<distDir>/.vite/manifest.json`) synchronously.
 * Returns `null` if the manifest doesn't exist, so callers can gracefully fall
 * back to `prodScriptSrc` or keep running a dev-only setup.
 *
 * Requires Vite's `build.manifest: true` option.
 */
export async function readViteManifest(
  distDir: string,
  filename: string = VITE_MANIFEST_PATH,
): Promise<ViteManifest | null> {
  const { readFileSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const manifestPath = join(distDir, filename)
  if (!existsSync(manifestPath)) return null
  const raw = readFileSync(manifestPath, 'utf-8')
  return JSON.parse(raw) as ViteManifest
}
