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
