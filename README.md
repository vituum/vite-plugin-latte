# ⚡️☕ ViteLatte - Coming soon

```js
export default {
  plugins: [
    latte({
      php: 'php',
      filters: {
        icon: 'latte/IconFilter.php',
        nbsp: () => {}
      },
      functions: {},
      tags: {},
      globals: {},
      template: 'playground/templates/Layout/Main.latte'
    })
  ]
}
```

```html
<!-- index.html -->
<script type="application/json">
  {
    "template": "path/to/template.latte",
    "data": {
      "title": "Hello world"
    }
  }
</script>
```

### Requirements

- [Node.js LTS (16.x)](https://nodejs.org/en/download/)
- [NPM (8.x)](https://www.npmjs.com/package/npm) or [Yarn (2.x)](https://yarnpkg.com/)
- [PHP (8.x)](https://www.php.net/) or [Docker PHP (8.x)](https://hub.docker.com/_/php)
