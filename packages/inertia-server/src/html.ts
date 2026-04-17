function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

/** Escape `<` in JSON embedded in `<script>` to avoid closing the tag. */
export function escapeForScriptJson(json: string): string {
  return json.replace(/</g, '\\u003c')
}

/**
 * Minimal HTML shell matching [first-visit response](https://inertiajs.com/docs/v3/core-concepts/the-protocol#html-responses).
 * Apps typically replace this with a Vite-powered template via `renderHtml`.
 */
export function defaultHtmlShell(input: {
  pageJson: string
  rootElementId: string
  pageScriptDataAttribute: string
  title?: string
}): string {
  const title = input.title ?? 'App'
  const safeJson = escapeForScriptJson(input.pageJson)
  const dataPage = escapeAttr(input.pageScriptDataAttribute)
  const rootId = escapeAttr(input.rootElementId)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title data-inertia="">${escapeAttr(title)}</title>
</head>
<body>
<script data-page="${dataPage}" type="application/json">${safeJson}</script>
<div id="${rootId}"></div>
</body>
</html>`
}
