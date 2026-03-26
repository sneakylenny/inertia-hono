import type { InertiaPage } from 'inertia-hono'

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Avoid `</script>` breaking out of the embedded JSON script tag. */
function escapeForScriptJson(json: string): string {
  return json.replace(/</g, '\\u003c')
}

export type PlaygroundHtmlOptions = {
  /** Where the Vite dev server (or CDN) serves JS from, e.g. http://localhost:5173 */
  viteOrigin: string
  /** When true, inject @vite/client + main entry for HMR. When false, use built asset path. */
  dev: boolean
  /** Production entry path, e.g. /assets/main-xxxxx.js (set after `vite build`) */
  prodScriptSrc?: string
}

/**
 * Full HTML document for full-page Inertia loads: protocol page JSON + root + Vue client.
 */
export function createPlaygroundHtmlRenderer(options: PlaygroundHtmlOptions) {
  return async (ctx: {
    page: InertiaPage
    pageJson: string
    rootElementId: string
    pageScriptDataAttribute: string
  }) => {
    const { pageJson, rootElementId, pageScriptDataAttribute, page } = ctx
    const safeJson = escapeForScriptJson(pageJson)
    const dataPage = escapeAttr(pageScriptDataAttribute)
    const rootId = escapeAttr(rootElementId)
    const title = escapeHtml(page.component)

    const viteOrigin = options.viteOrigin.replace(/\/$/, '')
    const clientScripts = options.dev
      ? `\n<script type="module" src="${viteOrigin}/@vite/client"></script>\n<script type="module" src="${viteOrigin}/src/inertia/main.ts"></script>\n`
      : `\n<script type="module" src="${options.prodScriptSrc ?? '/assets/main.js'}"></script>\n`

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
</head>
<body class="min-h-screen bg-base-200">
<script data-page="${dataPage}" type="application/json">${safeJson}</script>
<div id="${rootId}"></div>${clientScripts}
</body>
</html>`
  }
}
