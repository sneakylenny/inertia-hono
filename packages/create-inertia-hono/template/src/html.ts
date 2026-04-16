import type { InertiaPage } from 'inertia-hono'

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function escapeForScriptJson(json: string): string {
  return json.replace(/</g, '\\u003c')
}

export type HtmlRendererOptions = {
  viteOrigin: string
  dev: boolean
  prodScriptSrc?: string
}

export function createHtmlRenderer(options: HtmlRendererOptions) {
  return async (ctx: {
    page: InertiaPage
    pageJson: string
    rootElementId: string
    pageScriptDataAttribute: string
  }) => {
    const { pageJson, rootElementId, pageScriptDataAttribute } = ctx
    const safeJson = escapeForScriptJson(pageJson)
    const dataPage = escapeAttr(pageScriptDataAttribute)
    const rootId = escapeAttr(rootElementId)

    const origin = options.viteOrigin.replace(/\/$/, '')
    const scripts = options.dev
      ? `\n<script type="module" src="${origin}/@vite/client"></script>\n<script type="module" src="${origin}/src/inertia/main.ts"></script>\n`
      : `\n<script type="module" src="${options.prodScriptSrc ?? '/assets/main.js'}"></script>\n`

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Inertia + Hono</title>
</head>
<body class="min-h-screen bg-base-200">
<script data-page="${dataPage}" type="application/json">${safeJson}</script>
<div id="${rootId}"></div>${scripts}
</body>
</html>`
  }
}
