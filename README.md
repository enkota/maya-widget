# Maya Website Chat Widget

A lightweight TypeScript widget that embeds a live-chat popup in the bottom-right corner of any website. The widget loads a Maya bot conversation from `https://supmaya.com/bots/<botIntegrationId>/chat` and is configured entirely via the script options.

## Quick start

1. Build the project:

```bash
npm install
npm run build
```

2. Serve the compiled widget from `dist/chatbot-widget.js` (for example through a CDN or your web server).

3. Embed it on your site using a module script tag:

```html
<script type="module">
  import ChatbotWidget from '/path/to/chatbot-widget.js';

  const widget = new ChatbotWidget({
    botIntegrationId: '1207',
    colors: {
      primary: '#0084ff',
      iconFill: 'white'
    }
  });

  // Optional public API example
  window.openMayaChat = () => widget.open();
</script>
```

The widget automatically injects the chat iframe and floating launcher button. Clicking the button toggles the chat window.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `botIntegrationId` | `string` | _required_ | Identifier for the Maya bot integration. |
| `baseUrl` | `string` | `https://supmaya.com` | Base Maya host. The chat iframe loads from `${baseUrl}/bots/<botIntegrationId>/chat`. |
| `position.bottom` | `string` | `20px` | Distance from the bottom edge of the viewport. |
| `position.right` | `string` | `20px` | Distance from the right edge of the viewport. |
| `size.width` | `string` | `60px` | Launcher width. |
| `size.height` | `string` | `60px` | Launcher height. |
| `colors.primary` | `string` | `#0084ff` | Launcher background. |
| `colors.iconFill` | `string` | `#ffffff` | Icon color. |
| `colors.background` | `string` | `#ffffff` | Chat window background color. |
| `hideBranding` | `boolean` | `false` | Hide "Powered by Maya" footer when `true`. |
| `zIndex` | `number` | `2147483000` | Override stacking order. |
| `buttonVariant` | `'classic' \| 'live_agent'` | `'classic'` | Choose between the default icon button or a photo-based live agent style. |
| `buttonImageUrl` | `string` | `undefined` | Override image when using `live_agent` variant. |

Remote configuration has been removed; supply all options directly when creating the widget instance.

## Development

- `npm run build` – compile TypeScript into `dist/`
- `npm run dev` – watch for file changes and rebuild
- `npm run lint` – type-check without emitting files

## Distribution tips

- Upload the files under `dist/` to a static host or CDN.
- Serve with appropriate `Content-Type: text/javascript` headers.
- Version the asset filename or the hosting path if you expect clients to cache aggressively.
