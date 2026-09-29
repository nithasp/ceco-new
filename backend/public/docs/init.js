/* global SwaggerUIBundle */
// Served from the API itself so the docs page loads no inline script and helmet's CSP can stay strict
window.ui = SwaggerUIBundle({
  url: '/openapi.yaml',
  dom_id: '#swagger-ui',
  deepLinking: true,
  presets: [SwaggerUIBundle.presets.apis],
  layout: 'BaseLayout',
  docExpansion: 'none',
  defaultModelsExpandDepth: 0,
  tryItOutEnabled: true,
  persistAuthorization: true,
  tagsSorter: 'alpha',
});
