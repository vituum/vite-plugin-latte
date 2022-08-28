<a href="https://npmjs.com/package/vite-plugin-latte"><img src="https://img.shields.io/npm/v/vite-plugin-latte.svg" alt="npm package"></a>
<a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite-plugin-latte.svg" alt="node compatility"></a>

# ⚡️☕ ViteLatte

```js
import latte from '@vituum/vite-plugin-latte'

export default {
  plugins: [
    latte({
      bin: 'php', // php or docker or your own binary path
      filters: {
        icon: 'latte/IconFilter.php',
        nbsp: () => {}
      },
      functions: {},
      tags: {},
      globals: {
          template: 'playground/templates/Layout/Main.latte'
      },
      data: '*.json',
      isStringFilter: undefined,
      filetypes: {
          html: /.(json.html|latte.json.html|latte.html)$/,
          json: /.(json.latte.html)$/
      }
    })
  ]
}
```

Read the [docs](https://vituum.dev/config/integrations-options.html#vituum-latte) to learn more about the plugin options.

## Basic usage

```html
<!-- index.html -->
<script type="application/json">
  {
    "template": "path/to/template.latte",
    "title": "Hello world"
  }
</script>
```
or
```html
<!-- index.latte.html with index.latte.json -->
{$title}
```
or
```html
<!-- index.latte.html or index.latte.json.html  -->
{
  "template": "path/to/template.latte",
  "title": "Hello world"
}
```

### Requirements

- [Node.js LTS (16.x)](https://nodejs.org/en/download/)
- [PHP (8.x)](https://www.php.net/) or [Docker PHP (8.x)](https://hub.docker.com/_/php)
- [Vite](https://vitejs.dev/) or [Vituum](https://vituum.dev/)
