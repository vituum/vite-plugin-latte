<a href="https://npmjs.com/package/@vituum/vite-plugin-latte"><img src="https://img.shields.io/npm/v/@vituum/vite-plugin-latte.svg" alt="npm package"></a>
<a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/@vituum/vite-plugin-latte.svg" alt="node compatility"></a>

# ⚡️☕ ViteLatte

```js
import latte from '@vituum/vite-plugin-latte'

export default {
    plugins: [
        latte()
    ],
    build: {
        rollupOptions: {
            input: ['index.latte.html']
        }
    }
}
```

* Read the [docs](https://vituum.dev/plugins/latte.html) to learn more about the plugin options.
* Use with [Vituum](https://vituum.dev) to get multi-page support.

## Basic usage

```html
```html
<!-- index.latte with index.latte.json -->
{$title}
```
or
```html
<!-- index.json  -->
{
  "template": "path/to/template.latte",
  "title": "Hello world"
}
```

### Requirements

- [Node.js LTS (16.x)](https://nodejs.org/en/download/)
- [PHP (8.x)](https://www.php.net/) or [Docker PHP (8.x)](https://hub.docker.com/_/php)
- [Vite](https://vitejs.dev/)
